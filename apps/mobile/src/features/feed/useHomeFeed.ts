import { useCallback } from "react";

import { recordPostImpressions } from "./api";
import { useHomeFeedActions } from "./useHomeFeedActions";
import { useHomeFeedFeedback } from "./useHomeFeedFeedback";
import { useHomeFeedPagination } from "./useHomeFeedPagination";
import { useHomeFeedSync } from "./useHomeFeedSync";
import { useHomeVideoStatusPolling } from "./useHomeVideoStatusPolling";

// 홈 피드 훅의 public 진입점. 화면은 이 훅 하나만 알고, 내부 책임은 하위 훅들이 나눠 가진다.
export function useHomeFeed() {
  const { feedback, showFeedback } = useHomeFeedFeedback();
  const {
    bookmarkedPostIds,
    errorMessage,
    handleLoadMore,
    handleRefresh,
    handleRetryFirstPage,
    isInitialLoading,
    isLoadingMore,
    isRefreshing,
    likedPostIds,
    loadFirstPage,
    postRanks,
    posts,
    setBookmarkedPostIds,
    setErrorMessage,
    setLikedPostIds,
    setPosts,
  } = useHomeFeedPagination();

  const {
    handleBlockUser,
    handleCommentCountChange,
    handleDeletePost,
    handleReportPost,
    handleToggleBookmark,
    handleToggleLike,
  } = useHomeFeedActions({
    bookmarkedPostIds,
    likedPostIds,
    posts,
    setBookmarkedPostIds,
    setErrorMessage,
    setLikedPostIds,
    setPosts,
    showFeedback,
  });

  const { refreshInteractions } = useHomeFeedSync({
    posts,
    setBookmarkedPostIds,
    setLikedPostIds,
    setPosts,
  });

  useHomeVideoStatusPolling({ posts, setPosts, showFeedback });

  const handlePostImpressions = useCallback(async (postIds: string[]) => {
    try {
      await recordPostImpressions(postIds);
    } catch {
      // 피드 노출 기록 실패는 피드 동작을 막지 않는다.
    }
  }, []);

  return {
    bookmarkedPostIds,
    errorMessage,
    feedback,
    handleBlockUser,
    handleCommentCountChange,
    handleDeletePost,
    handleLoadMore,
    handlePostImpressions,
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
    postRanks,
    posts,
    refreshInteractions,
    showFeedback,
  };
}
