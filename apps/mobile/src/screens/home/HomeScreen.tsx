import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StateView } from "../../components/common/StateView";
import { CommentsSheet } from "../../components/comments/CommentsSheet";
import { FeedPostCard } from "../../components/feed/FeedPostCard";
import { PostShareSheet } from "../../components/feed/PostShareSheet";
import { HomeHeader } from "../../components/home/HomeHeader";
import { StoryBar } from "../../components/stories/StoryBar";
import { signOutMobile } from "../../features/auth/api";
import { usePostShare, type PostShareTarget } from "../../features/chat/usePostShare";
import { useHomeFeed } from "../../features/feed/useHomeFeed";
import { useHomeMeta } from "../../features/feed/useHomeMeta";
import type { FeedPost } from "../../features/feed/types";
import type { StoryGroup } from "../../features/stories/types";
import { useSession } from "../../lib/session";
import { SITE_URL } from "../../lib/site";
import { colors } from "../../lib/theme";

export function HomeScreen() {
  const router = useRouter();
  const { session } = useSession();
  const currentUserId = session?.user.id ?? "";
  const [commentSheetPostId, setCommentSheetPostId] = useState<string | null>(null);
  const [sharePost, setSharePost] = useState<FeedPost | null>(null);
  // 화면에 보이는(활성) 게시물 id — 영상 자동재생용. 가장 위 보이는 항목 1개만 활성.
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const firstVisibleId = viewableItems[0]?.item?.id ?? null;
      setActivePostId(firstVisibleId);
    },
  ).current;
  const {
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
      void refreshInteractions();
    }, [refreshInteractions]),
  );

  async function handleSignOut() {
    await signOutMobile();
  }

  const handleUserPress = useCallback(
    (nickname: string) => {
      router.push({
        pathname: "/profile/[nickname]",
        params: { nickname },
      });
    },
    [router],
  );

  const handleCommentUserPress = useCallback(
    (nickname: string) => {
      setCommentSheetPostId(null);
      handleUserPress(nickname);
    },
    [handleUserPress],
  );

  const handlePressCreateStory = useCallback(() => {
    router.push("/story/create");
  }, [router]);

  const handlePressNotifications = useCallback(() => {
    router.push("/notifications");
  }, [router]);

  const handlePressMessages = useCallback(() => {
    router.push("/messages");
  }, [router]);

  const handlePressStoryGroup = useCallback(
    (group: StoryGroup) => {
      router.push({
        pathname: "/story/[userId]",
        params: { userId: group.user.id },
      });
    },
    [router],
  );

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
      router.push({
        pathname: "/messages/[conversationId]",
        params: { conversationId },
      });
    },
    [router, sharePost, sharePostToTarget, showFeedback],
  );

  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <StateView
          message="학교 피드를 불러오는 중입니다."
          title="피드 준비 중"
          type="loading"
        />
      </SafeAreaView>
    );
  }

  if (errorMessage && posts.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <HomeHeader
          onPressMessages={handlePressMessages}
          onPressNotifications={handlePressNotifications}
          onSignOut={handleSignOut}
          unreadChatCount={unreadChatCount}
          unreadCount={unreadCount}
        />
        <StateView
          actionLabel="다시 시도"
          message={errorMessage}
          onAction={handleRetryFirstPage}
          title="피드를 불러오지 못했습니다"
          type="error"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        ListEmptyComponent={
          <StateView
            message="같은 학교 공개 게시물이 아직 없습니다."
            title="아직 게시물이 없습니다"
          />
        }
        ListFooterComponent={
          isLoadingMore ? (
            <StateView
              message="잠시만 기다려주세요."
              title="더 불러오는 중"
              type="loading"
            />
          ) : null
        }
        ListHeaderComponent={
          <>
            <HomeHeader
              onPressMessages={handlePressMessages}
              onPressNotifications={handlePressNotifications}
              onSignOut={handleSignOut}
              unreadChatCount={unreadChatCount}
              unreadCount={unreadCount}
            />
            <StoryBar
              groups={storyGroups}
              onPressCreate={handlePressCreateStory}
              onPressGroup={handlePressStoryGroup}
            />
          </>
        }
        contentContainerStyle={styles.listContent}
        data={posts}
        keyExtractor={(post) => post.id}
        onEndReached={() => {
          void handleLoadMore();
        }}
        onEndReachedThreshold={0.7}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              void handleRefresh();
            }}
            refreshing={isRefreshing}
            tintColor={colors.accent}
          />
        }
        renderItem={({ item }) => (
          <FeedPostCard
            currentUserId={currentUserId}
            isActive={item.id === activePostId}
            isBookmarked={bookmarkedPostIds.has(item.id)}
            isLiked={likedPostIds.has(item.id)}
            onBlockUser={(userId) => {
              void handleBlockUser(userId);
            }}
            onBookmark={(postId) => {
              void handleToggleBookmark(postId);
            }}
            onComment={setCommentSheetPostId}
            onDelete={(postId) => {
              void handleDeletePost(postId);
            }}
            onLike={(postId) => {
              void handleToggleLike(postId);
            }}
            onReport={(postId) => {
              void handleReportPost(postId);
            }}
            onShare={setSharePost}
            onUserPress={handleUserPress}
            onVideoPress={(postId) =>
              router.push({ pathname: "/reels", params: { postId } })
            }
            post={item}
          />
        )}
        style={styles.list}
      />
      {errorMessage && posts.length > 0 ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{errorMessage}</Text>
        </View>
      ) : null}
      {feedback ? (
        <View
          style={[
            styles.inlineFeedback,
            feedback.type === "error" ? styles.inlineFeedbackError : null,
          ]}
        >
          <Text style={styles.inlineFeedbackText}>{feedback.message}</Text>
        </View>
      ) : null}
      <CommentsSheet
        isOpen={Boolean(commentSheetPostId)}
        onClose={() => {
          setCommentSheetPostId(null);
        }}
        onCommentCountChange={handleCommentCountChange}
        onUserPress={handleCommentUserPress}
        postId={commentSheetPostId}
      />
      <PostShareSheet
        errorMessage={shareErrorMessage}
        externalShareUrl={
          sharePost?.visibility === "public"
            ? `${SITE_URL}/p/${sharePost.id}`
            : null
        }
        isLoading={isShareLoading}
        isOpen={Boolean(sharePost)}
        isSearching={isShareSearching}
        onClose={() => setSharePost(null)}
        onQueryChange={setShareQuery}
        onSelectTarget={(target) => {
          void handleSelectShareTarget(target);
        }}
        query={shareQuery}
        sendingTargetId={sendingTargetId}
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 96,
  },
  inlineError: {
    position: "absolute",
    right: 16,
    bottom: 96,
    left: 16,
    borderRadius: 16,
    backgroundColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inlineErrorText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  inlineFeedback: {
    position: "absolute",
    right: 16,
    bottom: 96,
    left: 16,
    borderRadius: 16,
    backgroundColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inlineFeedbackError: {
    backgroundColor: colors.danger,
  },
  inlineFeedbackText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
});
