import { useCallback, useEffect, useRef, useState } from "react";

import { blockUser } from "../blocks/api";
import { recordMetric } from "../metrics/api";
import { createReport } from "../reports/api";
import {
  deletePost,
  getAuthorVideoFeed,
  getBookmarkedPostIds,
  getLikedPostIds,
  getPost,
  getReelsRanked,
  toggleBookmark,
  togglePostLike,
} from "./api";
import type { FeedPost, FeedRankCursor, ReelFeedItem } from "./types";
import { PAGE_SIZE } from "../../lib/constants/pagination";

function isReadyVideoPost(post: FeedPost) {
  return (
    post.media.some((media) => media.type === "video") &&
    post.media.every((media) => media.processing_status === "ready")
  );
}

// 릴스(영상 전용 세로 피드) 데이터 + 좋아요/저장 + 활성 인덱스(보이는 영상 1개 재생).
// startPostId가 있으면 그 영상이 목록에 포함되도록 우선 로드한다.
export function useReels(startPostId?: string, authorUserId?: string) {
  const [reelItems, setReelItems] = useState<ReelFeedItem[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedback, setFeedback] = useState("");
  const cursorRef = useRef<FeedRankCursor | null>(null);
  const authorCursorRef = useRef<string | null>(null);
  const authorHasMoreRef = useRef(true);
  const [seed] = useState(() => Math.random());
  const seenIdsRef = useRef<Set<string>>(new Set());
  const itemSequenceRef = useRef(0);
  const likedPostIdsRef = useRef(likedPostIds);
  const pendingLikeRef = useRef<Set<string>>(new Set());
  const pendingBookmarkRef = useRef<Set<string>>(new Set());
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    likedPostIdsRef.current = likedPostIds;
  }, [likedPostIds]);

  const createReelItems = useCallback((nextPosts: FeedPost[]) => {
    return nextPosts.map((post) => {
      const sequence = itemSequenceRef.current;
      itemSequenceRef.current += 1;

      return {
        itemKey: `${post.id}:${sequence}`,
        post,
      };
    });
  }, []);

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

  // 릴스 조회 기록: 활성 릴스가 1초 이상 머물면 1회(빠른 스크롤 스침 제외).
  // 스크롤로 나갔다 다시 오면 새 조회로 카운트(dedupe 없음 → total=조회수, unique=도달).
  const boundedActiveIndex = Math.min(
    activeIndex,
    Math.max(0, reelItems.length - 1),
  );
  const activePost = reelItems[boundedActiveIndex]?.post;
  const activePostId = activePost?.id;
  useEffect(() => {
    if (!activePostId) {
      return;
    }
    const timer = setTimeout(() => {
      seenIdsRef.current.add(activePostId);
      void recordMetric("reel_view", activePostId);
    }, 1000);
    return () => clearTimeout(timer);
  }, [activePostId]);

  const loadFirstPage = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      cursorRef.current = null;
      authorCursorRef.current = null;
      authorHasMoreRef.current = true;

      let anchorPost: FeedPost | null = null;
      if (startPostId) {
        try {
          const post = await getPost(startPostId);
          anchorPost =
            isReadyVideoPost(post) &&
            (!authorUserId || post.user.id === authorUserId)
              ? post
              : null;
        } catch {
          anchorPost = null;
        }
      }

      let posts: FeedPost[];

      if (authorUserId) {
        const result = await getAuthorVideoFeed({
          anchorCreatedAt: anchorPost?.created_at,
          limit: PAGE_SIZE.feed,
          userId: authorUserId,
        });
        authorCursorRef.current = result.nextCursor;
        authorHasMoreRef.current = result.nextCursor !== null;
        posts = anchorPost
          ? [
              anchorPost,
              ...result.posts.filter((post) => post.id !== anchorPost.id),
            ]
          : result.posts;
      } else {
        const result = await getReelsRanked({
          limit: PAGE_SIZE.feed,
          seed,
          seenIds: Array.from(seenIdsRef.current),
        });
        cursorRef.current = result.nextCursor;
        posts = anchorPost
          ? [
              anchorPost,
              ...result.posts.filter((post) => post.id !== anchorPost.id),
            ]
          : result.posts;
      }

      itemSequenceRef.current = 0;
      setReelItems(createReelItems(posts));
      setActiveIndex(0);
      void loadStatuses(posts);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "영상을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [authorUserId, createReelItems, loadStatuses, seed, startPostId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadFirstPage();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadFirstPage]);

  async function loadMore() {
    if (
      isLoadingMore ||
      (authorUserId !== undefined && !authorHasMoreRef.current)
    ) {
      return;
    }
    try {
      setIsLoadingMore(true);

      if (authorUserId) {
        const result = await getAuthorVideoFeed({
          cursor: authorCursorRef.current ?? undefined,
          limit: PAGE_SIZE.feed,
          userId: authorUserId,
        });
        authorCursorRef.current = result.nextCursor;
        authorHasMoreRef.current = result.nextCursor !== null;
        setReelItems((current) => [
          ...current,
          ...createReelItems(result.posts),
        ]);
        void loadStatuses(result.posts);
        return;
      }

      const cursor = cursorRef.current;
      const result = await getReelsRanked({
        afterBand: cursor?.band ?? null,
        afterRank: cursor?.rank ?? null,
        limit: PAGE_SIZE.feed,
        seed,
        seenIds: Array.from(seenIdsRef.current),
      });
      cursorRef.current = result.nextCursor;
      setReelItems((current) => [
        ...current,
        ...createReelItems(result.posts),
      ]);
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
    const wasLiked = likedPostIdsRef.current.has(postId);
    const optimisticDelta = wasLiked ? -1 : 1;

    setLikedPostIds((current) => {
      const next = new Set(current);
      if (wasLiked) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
    setReelItems((current) =>
      current.map((item) =>
        item.post.id === postId
          ? {
              ...item,
              post: {
                ...item.post,
                likes_count: Math.max(
                  0,
                  item.post.likes_count + optimisticDelta,
                ),
              },
            }
          : item,
      ),
    );

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
      setReelItems((current) =>
        current.map((item) =>
          item.post.id === postId
            ? {
                ...item,
                post: { ...item.post, likes_count: result.likesCount },
              }
            : item,
        ),
      );
    } catch {
      setLikedPostIds((current) => {
        const next = new Set(current);
        if (wasLiked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
      setReelItems((current) =>
        current.map((item) =>
          item.post.id === postId
            ? {
                ...item,
                post: {
                  ...item.post,
                  likes_count: Math.max(
                    0,
                    item.post.likes_count - optimisticDelta,
                  ),
                },
              }
            : item,
        ),
      );
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
      setReelItems((current) =>
        current.filter((item) => item.post.user.id !== userId),
      );
      showFeedback("차단했어요");
    } catch {
      showFeedback("차단에 실패했습니다.");
    }
  }

  async function removePost(postId: string) {
    const previousItems = reelItems;
    setReelItems((current) =>
      current.filter((item) => item.post.id !== postId),
    );
    try {
      await deletePost(postId);
      showFeedback("삭제했어요");
    } catch {
      setReelItems(previousItems);
      showFeedback("삭제에 실패했습니다.");
    }
  }

  // 참조 안정화(useCallback) — 댓글 시트 effect가 매 렌더 재실행돼 깜빡이는 것 방지.
  const handleCommentCountChange = useCallback(
    (postId: string, nextCount: number) => {
      setReelItems((current) =>
        current.map((item) =>
          item.post.id === postId
            ? {
                ...item,
                post: { ...item.post, comments_count: nextCount },
              }
            : item,
        ),
      );
    },
    [],
  );

  return {
    activeIndex: boundedActiveIndex,
    blockAuthor,
    bookmarkedPostIds,
    errorMessage,
    feedback,
    handleCommentCountChange,
    isLoading,
    isLoadingMore,
    likedPostIds,
    loadMore,
    reelItems,
    removePost,
    reportPost,
    setActiveIndex,
    showFeedback,
    toggleBookmarkPost,
    toggleLike,
  };
}
