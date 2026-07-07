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
    refreshInteractions,
    showFeedback,
  };
}
