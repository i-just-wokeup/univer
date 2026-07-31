import { useCallback, useEffect, useRef, useState } from "react";

import { blockUser } from "../blocks/api";
import { recordMetric } from "../metrics/api";
import { createReport } from "../reports/api";
import {
  deletePost,
  getBookmarkedPostIds,
  getLikedPostIds,
  getPost,
  getReelsRanked,
  toggleBookmark,
  togglePostLike,
} from "./api";
import type { FeedPost, FeedRankCursor, ReelFeedItem } from "./types";
import { PAGE_SIZE } from "../../lib/constants/pagination";

function hasVideo(post: FeedPost) {
  return post.media.some((media) => media.type === "video");
}

// 릴스(영상 전용 세로 피드) 데이터 + 좋아요/저장 + 활성 인덱스(보이는 영상 1개 재생).
// startPostId가 있으면 그 영상이 목록에 포함되도록 우선 로드한다.
export function useReels(startPostId?: string) {
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
  const seedRef = useRef(Math.random());
  const seenIdsRef = useRef<Set<string>>(new Set());
  const itemSequenceRef = useRef(0);
  const likedPostIdsRef = useRef(likedPostIds);
  const pendingLikeRef = useRef<Set<string>>(new Set());
  const pendingBookmarkRef = useRef<Set<string>>(new Set());
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  likedPostIdsRef.current = likedPostIds;

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

  // 차단/삭제로 목록이 줄면 활성 인덱스가 범위를 벗어나지 않게 맞춘다.
  useEffect(() => {
    setActiveIndex((current) =>
      Math.min(current, Math.max(0, reelItems.length - 1)),
    );
  }, [reelItems.length]);

  // 릴스 조회 기록: 활성 릴스가 1초 이상 머물면 1회(빠른 스크롤 스침 제외).
  // 스크롤로 나갔다 다시 오면 새 조회로 카운트(dedupe 없음 → total=조회수, unique=도달).
  const activePost = reelItems[activeIndex]?.post;
  const activePostId = activePost?.id;
  const activeOwnerId = activePost?.user.id;
  useEffect(() => {
    if (!activePostId || !activeOwnerId) {
      return;
    }
    const timer = setTimeout(() => {
      seenIdsRef.current.add(activePostId);
      void recordMetric("reel_view", activePostId, activeOwnerId);
    }, 1000);
    return () => clearTimeout(timer);
  }, [activePostId, activeOwnerId]);

  const loadFirstPage = useCallback(async () => {
    try {
      setErrorMessage("");

      let anchorPost: FeedPost | null = null;
      if (startPostId) {
        try {
          const post = await getPost(startPostId);
          anchorPost = hasVideo(post) ? post : null;
        } catch {
          anchorPost = null;
        }
      }

      const result = await getReelsRanked({
        limit: PAGE_SIZE.feed,
        seed: seedRef.current,
        seenIds: Array.from(seenIdsRef.current),
      });
      cursorRef.current = result.nextCursor;
      const posts = anchorPost
        ? [
            anchorPost,
            ...result.posts.filter((post) => post.id !== anchorPost?.id),
          ]
        : result.posts;

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
  }, [createReelItems, loadStatuses, startPostId]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  async function loadMore() {
    if (isLoadingMore) {
      return;
    }
    try {
      setIsLoadingMore(true);
      const cursor = cursorRef.current;
      const result = await getReelsRanked({
        afterBand: cursor?.band ?? null,
        afterRank: cursor?.rank ?? null,
        limit: PAGE_SIZE.feed,
        seed: seedRef.current,
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
    reelItems,
    removePost,
    reportPost,
    setActiveIndex,
    showFeedback,
    toggleBookmarkPost,
    toggleLike,
  };
}
