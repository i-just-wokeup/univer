import { useCallback, useEffect, useRef, useState } from "react";

import { blockUser } from "../blocks/api";
import { createReport } from "../reports/api";
import {
  deletePost,
  getBookmarkedPostIds,
  getLikedPostIds,
  getPost,
  getVideoFeed,
  toggleBookmark,
  togglePostLike,
} from "./api";
import type { FeedPost } from "./types";
import { PAGE_SIZE } from "../../lib/constants/pagination";

// 릴스(영상 전용 세로 피드) 데이터 + 좋아요/저장 + 활성 인덱스(보이는 영상 1개 재생).
// startPostId가 있으면 그 영상이 목록에 포함되도록 우선 로드한다.
export function useReels(startPostId?: string) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedback, setFeedback] = useState("");
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const pendingLikeRef = useRef<Set<string>>(new Set());
  const pendingBookmarkRef = useRef<Set<string>>(new Set());
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadStatuses = useCallback(async (loadedPosts: FeedPost[]) => {
    const ids = loadedPosts.map((post) => post.id);
    if (ids.length === 0) {
      return;
    }
    try {
      const [liked, bookmarked] = await Promise.all([
        getLikedPostIds(ids),
        getBookmarkedPostIds(ids),
      ]);
      setLikedPostIds((current) => new Set([...current, ...liked]));
      setBookmarkedPostIds((current) => new Set([...current, ...bookmarked]));
    } catch {
      // 좋아요/저장 상태 로딩 실패는 무시(재생은 막지 않음).
    }
  }, []);

  const showFeedback = useCallback((message: string) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedback(message);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback("");
      feedbackTimerRef.current = null;
    }, 1800);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // 차단/삭제로 목록이 줄면 활성 인덱스가 범위를 벗어나지 않게 맞춘다.
  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, posts.length - 1)));
  }, [posts.length]);

  const loadFirstPage = useCallback(async () => {
    try {
      setErrorMessage("");

      // 특정 영상을 눌러 들어온 경우: 그 영상의 작성 시각을 앵커로 삼아 "그 시각 이하"부터 로딩한다.
      // → 누른 영상이 항상 목록 맨 위에 온다(최신 20개 밖의 오래된 영상도 정확히 그 영상에서 시작).
      // 삭제/차단된 영상이면 앵커 없이 최신 피드로 폴백.
      let anchorCreatedAt: string | undefined;
      if (startPostId) {
        try {
          const anchorPost = await getPost(startPostId);
          anchorCreatedAt = anchorPost.created_at;
        } catch {
          anchorCreatedAt = undefined;
        }
      }

      const result = await getVideoFeed({
        anchorCreatedAt,
        limit: PAGE_SIZE.feed,
      });
      cursorRef.current = result.nextCursor;
      hasMoreRef.current = result.nextCursor !== null;

      // 앵커 로딩이면 보통 0번째지만, 못 찾으면(폴백 등) 안전하게 0에서 시작.
      const foundIndex = startPostId
        ? result.posts.findIndex((post) => post.id === startPostId)
        : -1;

      setPosts(result.posts);
      setActiveIndex(foundIndex >= 0 ? foundIndex : 0);
      void loadStatuses(result.posts);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "영상을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadStatuses, startPostId]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  async function loadMore() {
    if (!hasMoreRef.current || isLoadingMore || !cursorRef.current) {
      return;
    }
    try {
      setIsLoadingMore(true);
      const result = await getVideoFeed({
        cursor: cursorRef.current,
        limit: PAGE_SIZE.feed,
      });
      cursorRef.current = result.nextCursor;
      hasMoreRef.current = result.nextCursor !== null;
      setPosts((current) => [...current, ...result.posts]);
      void loadStatuses(result.posts);
    } catch {
      // 추가 로딩 실패는 조용히 무시.
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function toggleLike(postId: string) {
    if (pendingLikeRef.current.has(postId)) {
      return;
    }
    pendingLikeRef.current.add(postId);
    try {
      const result = await togglePostLike(postId);
      setLikedPostIds((current) => {
        const next = new Set(current);
        if (result.liked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? { ...post, likes_count: result.likesCount }
            : post,
        ),
      );
    } catch {
      // 좋아요 실패 무시.
    } finally {
      pendingLikeRef.current.delete(postId);
    }
  }

  async function toggleBookmarkPost(postId: string) {
    if (pendingBookmarkRef.current.has(postId)) {
      return;
    }
    pendingBookmarkRef.current.add(postId);
    const wasBookmarked = bookmarkedPostIds.has(postId);
    setBookmarkedPostIds((current) => {
      const next = new Set(current);
      if (wasBookmarked) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
    try {
      const result = await toggleBookmark(postId);
      setBookmarkedPostIds((current) => {
        const next = new Set(current);
        if (result.bookmarked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
    } catch {
      // 실패 시 롤백.
      setBookmarkedPostIds((current) => {
        const next = new Set(current);
        if (wasBookmarked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
    } finally {
      pendingBookmarkRef.current.delete(postId);
    }
  }

  async function reportPost(postId: string) {
    try {
      await createReport({ targetId: postId, targetType: "post" });
      showFeedback("신고가 접수됐어요");
    } catch {
      showFeedback("신고에 실패했습니다.");
    }
  }

  async function blockAuthor(userId: string) {
    try {
      await blockUser(userId);
      // 차단한 유저의 영상은 목록에서 즉시 제거(활성 인덱스는 위 effect가 보정).
      setPosts((current) => current.filter((post) => post.user.id !== userId));
      showFeedback("차단했어요");
    } catch {
      showFeedback("차단에 실패했습니다.");
    }
  }

  async function removePost(postId: string) {
    const previousPosts = posts;
    setPosts((current) => current.filter((post) => post.id !== postId));
    try {
      await deletePost(postId);
      showFeedback("삭제했어요");
    } catch {
      setPosts(previousPosts);
      showFeedback("삭제에 실패했습니다.");
    }
  }

  // 참조 안정화(useCallback) — 댓글 시트 effect가 매 렌더 재실행돼 깜빡이는 것 방지.
  const handleCommentCountChange = useCallback(
    (postId: string, nextCount: number) => {
      setPosts((current) =>
        current.map((post) =>
          post.id === postId ? { ...post, comments_count: nextCount } : post,
        ),
      );
    },
    [],
  );

  return {
    activeIndex,
    blockAuthor,
    bookmarkedPostIds,
    errorMessage,
    feedback,
    handleCommentCountChange,
    isLoading,
    isLoadingMore,
    likedPostIds,
    loadMore,
    posts,
    removePost,
    reportPost,
    setActiveIndex,
    showFeedback,
    toggleBookmarkPost,
    toggleLike,
  };
}
