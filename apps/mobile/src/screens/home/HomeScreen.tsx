import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HomeFeedbackBanner } from "../../components/home/HomeFeedbackBanner";
import {
  HomeFeedList,
  type HomeFeedListHandle,
} from "../../components/home/HomeFeedList";
import { HomeErrorState, HomeLoadingState } from "../../components/home/HomeScreenStates";
import { HomeSheets } from "../../components/home/HomeSheets";
import { signOutMobile } from "../../features/auth/api";
import { usePostShare, type PostShareTarget } from "../../features/chat/usePostShare";
import { useHomeFeed } from "../../features/feed/useHomeFeed";
import { useHomeMeta } from "../../features/feed/useHomeMeta";
import type { FeedPost } from "../../features/feed/types";
import { useStoryCreationAccess } from "../../features/stories/useStoryCreationAccess";
import { subscribeHomeTabReselect } from "../../lib/navigation/homeTabReselect";
import { useSession } from "../../lib/session";
import { useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { useHomeNavigation } from "./useHomeNavigation";

export function HomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { session } = useSession();
  const currentUserId = session?.user.id ?? "";
  const { canCreateStory } = useStoryCreationAccess();
  const homeFeedListRef = useRef<HomeFeedListHandle | null>(null);
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
    refreshFeedSilently,
    showFeedback,
  } = useHomeFeed();
  const { storyGroups, unreadChatCount, unreadCount } = useHomeMeta();
  const {
    canAddPostToStory,
    errorMessage: shareErrorMessage,
    isLoading: isShareLoading,
    isSearching: isShareSearching,
    query: shareQuery,
    sendingTargetId,
    setQuery: setShareQuery,
    sharePostToTarget,
    visibleTargets: shareTargets,
  } = usePostShare(Boolean(sharePost), canCreateStory);
  // 사진/글 게시 후 홈 도착 시 완료 토스트(영상은 홈 폴링이 별도로 띄움).
  const { posted } = useLocalSearchParams<{ posted?: string }>();

  useEffect(() => {
    if (posted === "1") {
      showFeedback("게시물 업로드가 완료됐어요", "success");
      router.setParams({ posted: "" });
    }
  }, [posted, showFeedback, router]);

  // 첫 진입은 캐시를 즉시 표시한 뒤 백그라운드에서 재검증한다. 이후 홈으로 돌아올 때마다
  // 스피너 없이 첫 페이지를 다시 받아 다른 사용자의 새 게시물과 상호작용 상태를 맞춘다.
  const hasFocusedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedRef.current) {
        hasFocusedRef.current = true;
        return;
      }
      void refreshFeedSilently();
    }, [refreshFeedSilently]),
  );

  // 홈 탭 재탭 시 맨 위로 이동하고 스피너 없이 최신 첫 페이지를 확인한다.
  // RefreshControl을 직접 구동하지 않아 기존 iOS 상단 여백 글리치는 재발하지 않는다.
  useEffect(
    () =>
      subscribeHomeTabReselect(() => {
        homeFeedListRef.current?.scrollToTop();
        void refreshFeedSilently();
      }),
    [refreshFeedSilently],
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

  const handleAddSharePostToStory = useCallback(() => {
    if (!sharePost || !canAddPostToStory(sharePost.user.id)) {
      return;
    }

    const sharedPostId = sharePost.id;
    setSharePost(null);
    router.push({
      pathname: "/story/create",
      params: { sharedPostId },
    });
  }, [canAddPostToStory, router, sharePost]);

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
        canCreateStory={canCreateStory}
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
        ref={homeFeedListRef}
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
        onAddToStory={
          sharePost && canAddPostToStory(sharePost.user.id)
            ? handleAddSharePostToStory
            : undefined
        }
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

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.accentSoft,
  },
});
