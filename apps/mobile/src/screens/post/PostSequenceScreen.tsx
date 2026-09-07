import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItemInfo,
  StyleSheet,
  View,
  type ViewToken,
} from "react-native";

import { CommentsSheet } from "../../components/comments/CommentsSheet";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { ScreenHeader } from "../../components/common/ScreenHeader";
import { StateView } from "../../components/common/StateView";
import { FeedPostCard } from "../../components/feed/FeedPostCard";
import { PostShareSheet } from "../../components/feed/PostShareSheet";
import { HomeFeedbackBanner } from "../../components/home/HomeFeedbackBanner";
import {
  usePostShare,
  type PostShareTarget,
} from "../../features/chat/usePostShare";
import {
  usePostSequence,
  type PostSequenceSource,
} from "../../features/feed/usePostSequence";
import type { FeedPost } from "../../features/feed/types";
import { useStoryCreationAccess } from "../../features/stories/useStoryCreationAccess";
import { useSession } from "../../lib/session";
import { SITE_URL } from "../../lib/site";
import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type PostSequenceScreenProps = {
  postId: string;
  profileUserId?: string;
  source: PostSequenceSource;
};

const ACTIVE_VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 60,
};

function getPostIdFromViewToken(token: ViewToken): string | null {
  const item = token.item;

  return typeof item === "object" &&
    item !== null &&
    "id" in item &&
    typeof item.id === "string"
    ? item.id
    : null;
}

export function PostSequenceScreen({
  postId,
  profileUserId,
  source,
}: PostSequenceScreenProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const isScreenFocused = useIsFocused();
  const { session } = useSession();
  const currentUserId = session?.user.id ?? "";
  const { canCreateStory } = useStoryCreationAccess();
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [sharePost, setSharePost] = useState<FeedPost | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const handleActiveViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const firstVisibleId =
        viewableItems.map(getPostIdFromViewToken).find((id) => id) ?? null;
      setActivePostId(firstVisibleId);
    },
    [],
  );
  const {
    bookmarkedPostIds,
    errorMessage,
    feedback,
    handleBlockUser,
    handleCommentCountChange,
    handleDeletePost,
    handleLoadMore,
    handleReportPost,
    handleToggleBookmark,
    handleToggleLike,
    isInitialLoading,
    isLoadingMore,
    likedPostIds,
    posts,
    retry,
    showFeedback,
  } = usePostSequence({ postId, profileUserId, source });
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

  const handleUserPress = useCallback(
    (nickname: string) => {
      router.push({ pathname: "/profile/[nickname]", params: { nickname } });
    },
    [router],
  );

  const handleVideoPress = useCallback(
    (selectedPostId: string, authorUserId: string) => {
      router.push({
        pathname: "/reels",
        params: { postId: selectedPostId, userId: authorUserId },
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

  const renderPost = useCallback(
    ({ item }: ListRenderItemInfo<FeedPost>) => (
      <FeedPostCard
        currentUserId={currentUserId}
        isActive={isScreenFocused && item.id === activePostId}
        isBookmarked={bookmarkedPostIds.has(item.id)}
        isLiked={likedPostIds.has(item.id)}
        onBlockUser={(userId) => {
          void handleBlockUser(userId);
        }}
        onBookmark={(selectedPostId) => {
          void handleToggleBookmark(selectedPostId);
        }}
        onComment={setCommentPostId}
        onDelete={(selectedPostId) => {
          void handleDeletePost(selectedPostId);
        }}
        onLike={(selectedPostId) => {
          void handleToggleLike(selectedPostId);
        }}
        onReport={(selectedPostId) => {
          void handleReportPost(selectedPostId);
        }}
        onShare={setSharePost}
        onUserPress={handleUserPress}
        onVideoPress={(selectedPostId) => {
          handleVideoPress(selectedPostId, item.user.id);
        }}
        post={item}
      />
    ),
    [
      bookmarkedPostIds,
      activePostId,
      currentUserId,
      handleBlockUser,
      handleDeletePost,
      handleReportPost,
      handleToggleBookmark,
      handleToggleLike,
      handleUserPress,
      handleVideoPress,
      isScreenFocused,
      likedPostIds,
    ],
  );

  return (
    <ScreenContainer
      contentBackgroundColor={colors.accentSoft}
      style={styles.screen}
    >
      <ScreenHeader onBack={() => router.back()} themed title="게시물" />

      {isInitialLoading ? (
        <StateView
          message="게시물을 불러오는 중입니다."
          title="게시물 준비 중"
          type="loading"
        />
      ) : errorMessage && posts.length === 0 ? (
        <StateView
          actionLabel="다시 시도"
          message={errorMessage}
          onAction={() => {
            void retry();
          }}
          title="게시물을 불러오지 못했습니다"
          type="error"
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={posts}
          keyExtractor={(post) => post.id}
          ListEmptyComponent={
            <StateView
              message="표시할 게시물이 없습니다."
              title="게시물이 없습니다"
            />
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator color={colors.accent} size="small" />
              </View>
            ) : null
          }
          onEndReached={() => {
            void handleLoadMore();
          }}
          onEndReachedThreshold={0.8}
          onViewableItemsChanged={handleActiveViewableItemsChanged}
          renderItem={renderPost}
          showsVerticalScrollIndicator={false}
          viewabilityConfig={ACTIVE_VIEWABILITY_CONFIG}
        />
      )}

      <HomeFeedbackBanner
        errorMessage={posts.length > 0 ? errorMessage : ""}
        feedback={feedback}
      />

      <CommentsSheet
        isOpen={commentPostId !== null}
        onClose={() => setCommentPostId(null)}
        onCommentCountChange={handleCommentCountChange}
        onUserPress={(nickname) => {
          setCommentPostId(null);
          handleUserPress(nickname);
        }}
        postId={commentPostId}
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
        onAddToStory={
          sharePost && canAddPostToStory(sharePost.user.id)
            ? handleAddSharePostToStory
            : undefined
        }
        onClose={() => setSharePost(null)}
        onQueryChange={setShareQuery}
        onSelectTarget={(target) => {
          void handleSelectShareTarget(target);
        }}
        query={shareQuery}
        sendingTargetId={sendingTargetId}
        targets={shareTargets}
      />
    </ScreenContainer>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.accentSoft,
    },
    listContent: {
      flexGrow: 1,
      paddingTop: 8,
      paddingBottom: 40,
    },
    loadingMore: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 20,
    },
  });
