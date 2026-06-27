import { useCallback, useEffect, useRef, useState } from "react";

import { blockUser } from "../blocks/api";
import { createReport } from "../reports/api";
import {
  deletePost,
  getBookmarkedPostIds,
  getFeed,
  getLikedPostIds,
  toggleBookmark,
  togglePostLike,
} from "./api";
import type { FeedPost } from "./types";

type FeedbackType = "error" | "success";

type FeedbackState = {
  message: string;
  type: FeedbackType;
} | null;

export function useHomeFeed() {
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingBookmarkPostIdsRef = useRef<Set<string>>(new Set());
  const pendingLikePostIdsRef = useRef<Set<string>>(new Set());

  const showFeedback = useCallback((message: string, type: FeedbackType) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    setFeedback({ message, type });
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
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

  const loadFirstPage = useCallback(async () => {
    try {
      setErrorMessage("");
      const result = await getFeed();
      const postIds = result.posts.map((post) => post.id);
      const [likedIds, bookmarkedIds] = await Promise.all([
        getLikedPostIds(postIds),
        getBookmarkedPostIds(postIds),
      ]);

      setPosts(result.posts);
      setNextCursor(result.nextCursor);
      setLikedPostIds(new Set(likedIds));
      setBookmarkedPostIds(new Set(bookmarkedIds));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "피드를 불러오지 못했습니다.",
      );
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadFirstPage();
  }

  function handleRetryFirstPage() {
    setIsInitialLoading(true);
    void loadFirstPage();
  }

  async function handleLoadMore() {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const result = await getFeed({ cursor: nextCursor });
      const postIds = result.posts.map((post) => post.id);
      const [likedIds, bookmarkedIds] = await Promise.all([
        getLikedPostIds(postIds),
        getBookmarkedPostIds(postIds),
      ]);

      setPosts((currentPosts) => [...currentPosts, ...result.posts]);
      setNextCursor(result.nextCursor);
      setLikedPostIds((currentLikedPostIds) => {
        const nextLikedPostIds = new Set(currentLikedPostIds);
        likedIds.forEach((postId) => {
          nextLikedPostIds.add(postId);
        });
        return nextLikedPostIds;
      });
      setBookmarkedPostIds((currentBookmarkedPostIds) => {
        const nextBookmarkedPostIds = new Set(currentBookmarkedPostIds);
        bookmarkedIds.forEach((postId) => {
          nextBookmarkedPostIds.add(postId);
        });
        return nextBookmarkedPostIds;
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "피드를 더 불러오지 못했습니다.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleToggleLike(postId: string) {
    if (pendingLikePostIdsRef.current.has(postId)) {
      return;
    }

    pendingLikePostIdsRef.current.add(postId);

    try {
      const result = await togglePostLike(postId);

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId ? { ...post, likes_count: result.likesCount } : post,
        ),
      );
      setLikedPostIds((currentLikedPostIds) => {
        const nextLikedPostIds = new Set(currentLikedPostIds);

        if (result.liked) {
          nextLikedPostIds.add(postId);
        } else {
          nextLikedPostIds.delete(postId);
        }
        return nextLikedPostIds;
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "좋아요를 처리하지 못했습니다.",
      );
    } finally {
      pendingLikePostIdsRef.current.delete(postId);
    }
  }

  async function handleToggleBookmark(postId: string) {
    if (pendingBookmarkPostIdsRef.current.has(postId)) {
      return;
    }

    pendingBookmarkPostIdsRef.current.add(postId);
    const wasBookmarked = bookmarkedPostIds.has(postId);

    setBookmarkedPostIds((currentBookmarkedPostIds) => {
      const nextBookmarkedPostIds = new Set(currentBookmarkedPostIds);

      if (wasBookmarked) {
        nextBookmarkedPostIds.delete(postId);
      } else {
        nextBookmarkedPostIds.add(postId);
      }

      return nextBookmarkedPostIds;
    });

    try {
      const result = await toggleBookmark(postId);

      setBookmarkedPostIds((currentBookmarkedPostIds) => {
        const nextBookmarkedPostIds = new Set(currentBookmarkedPostIds);

        if (result.bookmarked) {
          nextBookmarkedPostIds.add(postId);
        } else {
          nextBookmarkedPostIds.delete(postId);
        }

        return nextBookmarkedPostIds;
      });
      showFeedback(result.bookmarked ? "게시물을 저장했어요" : "저장을 취소했어요", "success");
    } catch (error) {
      setBookmarkedPostIds((currentBookmarkedPostIds) => {
        const nextBookmarkedPostIds = new Set(currentBookmarkedPostIds);

        if (wasBookmarked) {
          nextBookmarkedPostIds.add(postId);
        } else {
          nextBookmarkedPostIds.delete(postId);
        }

        return nextBookmarkedPostIds;
      });
      showFeedback(
        error instanceof Error ? error.message : "저장을 처리하지 못했습니다.",
        "error",
      );
    } finally {
      pendingBookmarkPostIdsRef.current.delete(postId);
    }
  }

  async function handleBlockUser(userId: string) {
    try {
      await blockUser(userId);
      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.user.id !== userId),
      );
      showFeedback("차단했어요", "success");
    } catch (error) {
      showFeedback(
        error instanceof Error ? error.message : "차단에 실패했습니다.",
        "error",
      );
    }
  }

  async function handleReportPost(postId: string) {
    try {
      await createReport({ targetId: postId, targetType: "post" });
      showFeedback("신고가 접수됐어요", "success");
    } catch (error) {
      showFeedback(
        error instanceof Error ? error.message : "신고에 실패했습니다.",
        "error",
      );
    }
  }

  async function handleDeletePost(postId: string) {
    const previousPosts = posts;

    setPosts((currentPosts) =>
      currentPosts.filter((post) => post.id !== postId),
    );

    try {
      await deletePost(postId);
      showFeedback("삭제했어요", "success");
    } catch (error) {
      setPosts(previousPosts);
      showFeedback(
        error instanceof Error ? error.message : "삭제에 실패했습니다.",
        "error",
      );
    }
  }

  const handleCommentCountChange = useCallback(
    (postId: string, nextCount: number) => {
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId ? { ...post, comments_count: nextCount } : post,
        ),
      );
    },
    [],
  );

  return {
    bookmarkedPostIds,
    errorMessage,
    feedback,
    handleBlockUser,
    handleCommentCountChange,
    handleDeletePost,
    handleLoadMore,
    handleRefresh,
    handleReportPost,
    handleRetryFirstPage,
    handleToggleBookmark,
    handleToggleLike,
    isInitialLoading,
    isLoadingMore,
    isRefreshing,
    likedPostIds,
    loadFirstPage,
    posts,
    showFeedback,
  };
}
