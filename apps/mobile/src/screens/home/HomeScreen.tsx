import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HomeFeedbackBanner } from "../../components/home/HomeFeedbackBanner";
import { HomeFeedList } from "../../components/home/HomeFeedList";
import { HomeErrorState, HomeLoadingState } from "../../components/home/HomeScreenStates";
import { HomeSheets } from "../../components/home/HomeSheets";
import { signOutMobile } from "../../features/auth/api";
import { usePostShare, type PostShareTarget } from "../../features/chat/usePostShare";
import { hasFreshFeedPageCache } from "../../features/feed/page-cache";
import { useHomeFeed } from "../../features/feed/useHomeFeed";
import { useHomeMeta } from "../../features/feed/useHomeMeta";
import type { FeedPost } from "../../features/feed/types";
import { useSession } from "../../lib/session";
import { colors } from "../../lib/theme";
import { useHomeNavigation } from "./useHomeNavigation";

export function HomeScreen() {
  const router = useRouter();
  const { session } = useSession();
  const currentUserId = session?.user.id ?? "";
  const [commentSheetPostId, setCommentSheetPostId] = useState<string | null>(null);
  const [sharePost, setSharePost] = useState<FeedPost | null>(null);
  const closeComments = useCallback(() => {
    setCommentSheetPostId(null);
  }, []);
  const {
    handleCommentUserPress,
    handlePressCreateStory,
    handlePressMessages,
    handlePressNotifications,
    handlePressStoryGroup,
    handleUserPress,
    handleVideoPress,
  } = useHomeNavigation({ closeComments });
  const {
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
    postRanks,
    posts,
    refreshInteractions,
    showFeedback,
  } = useHomeFeed();
  const { storyGroups, unreadChatCount, unreadCount } = useHomeMeta();
  const {
    errorMessage: shareErrorMessage,
    isLoading: isShareLoading,
    isSearching: isShareSearching,
    query: shareQuery,
    sendingTargetId,
    setQuery: setShareQuery,
    sharePostToTarget,
    visibleTargets: shareTargets,
  } = usePostShare(Boolean(sharePost));
  // 사진/글 게시 후 홈 도착 시 완료 토스트(영상은 홈 폴링이 별도로 띄움).
  const { posted } = useLocalSearchParams<{ posted?: string }>();

  useEffect(() => {
    if (posted === "1") {
      showFeedback("게시물 업로드가 완료됐어요", "success");
      router.setParams({ posted: "" });
    }
  }, [posted, showFeedback, router]);

  // 릴스/상세/프로필에서 좋아요·저장을 바꾸고 홈으로 돌아오면 목록 상태를 다시 맞춘다.
  // 첫 진입(마운트)은 loadFirstPage가 이미 처리하므로 건너뛴다.
  const hasFocusedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedRef.current) {
        hasFocusedRef.current = true;
        return;
      }
      if (currentUserId && hasFreshFeedPageCache(currentUserId)) {
        return;
      }
      void refreshInteractions();
    }, [currentUserId, refreshInteractions]),
  );

  const handleSignOut = useCallback(async () => {
    await signOutMobile();
  }, []);

  const handleSelectShareTarget = useCallback(
    async (target: PostShareTarget) => {
      if (!sharePost) {
        return;
      }

      const conversationId = await sharePostToTarget(sharePost.id, target.id);

      if (!conversationId) {
        return;
      }

      setSharePost(null);
      showFeedback("게시물을 보냈어요", "success");
    },
    [sharePost, sharePostToTarget, showFeedback],
  );

  if (isInitialLoading) {
    return (
      <HomeLoadingState
        message="학교 피드를 불러오는 중입니다."
        title="피드 준비 중"
      />
    );
  }

  if (errorMessage && posts.length === 0) {
    return (
      <HomeErrorState
        errorMessage={errorMessage}
        onPressMessages={handlePressMessages}
        onPressNotifications={handlePressNotifications}
        onRetry={handleRetryFirstPage}
        onSignOut={handleSignOut}
        unreadChatCount={unreadChatCount}
        unreadCount={unreadCount}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <HomeFeedList
        bookmarkedPostIds={bookmarkedPostIds}
        currentUserId={currentUserId}
        isLoadingMore={isLoadingMore}
        isRefreshing={isRefreshing}
        likedPostIds={likedPostIds}
        onBlockUser={handleBlockUser}
        onBookmark={handleToggleBookmark}
        onComment={setCommentSheetPostId}
        onDelete={handleDeletePost}
        onLike={handleToggleLike}
        onLoadMore={handleLoadMore}
        onPostImpressions={handlePostImpressions}
        onPressCreateStory={handlePressCreateStory}
        onPressMessages={handlePressMessages}
        onPressNotifications={handlePressNotifications}
        onPressStoryGroup={handlePressStoryGroup}
        onRefresh={handleRefresh}
        onReport={handleReportPost}
        onShare={setSharePost}
        onSignOut={handleSignOut}
        onUserPress={handleUserPress}
        onVideoPress={handleVideoPress}
        posts={posts}
        postRanks={postRanks}
        storyGroups={storyGroups}
        unreadChatCount={unreadChatCount}
        unreadCount={unreadCount}
      />
      <HomeFeedbackBanner
        errorMessage={posts.length > 0 ? errorMessage : ""}
        feedback={feedback}
      />
      <HomeSheets
        commentSheetPostId={commentSheetPostId}
        isShareLoading={isShareLoading}
        isShareSearching={isShareSearching}
        onCloseComments={closeComments}
        onCloseShare={() => setSharePost(null)}
        onCommentCountChange={handleCommentCountChange}
        onCommentUserPress={handleCommentUserPress}
        onQueryChange={setShareQuery}
        onSelectShareTarget={(target) => {
          void handleSelectShareTarget(target);
        }}
        query={shareQuery}
        sendingTargetId={sendingTargetId}
        shareErrorMessage={shareErrorMessage}
        sharePost={sharePost}
        targets={shareTargets}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
});
