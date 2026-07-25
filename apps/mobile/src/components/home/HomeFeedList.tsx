import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItem,
  type ViewToken,
} from "react-native";

import type { FeedPost } from "../../features/feed/types";
import type { StoryGroup } from "../../features/stories/types";
import { triggerLightHaptic } from "../../lib/haptics";
import { colors } from "../../lib/theme";
import { StateView } from "../common/StateView";
import { FeedPostCard } from "../feed/FeedPostCard";
import { StoryBar } from "../stories/StoryBar";
import { HomeHeader } from "./HomeHeader";

type MaybePromise = void | Promise<void>;

type HomeFeedListProps = {
  bookmarkedPostIds: Set<string>;
  currentUserId: string;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  likedPostIds: Set<string>;
  onBlockUser: (userId: string) => MaybePromise;
  onBookmark: (postId: string) => MaybePromise;
  onComment: (postId: string) => void;
  onDelete: (postId: string) => MaybePromise;
  onLike: (postId: string) => MaybePromise;
  onLoadMore: () => MaybePromise;
  onPressCreateStory: () => void;
  onPressMessages: () => void;
  onPressNotifications: () => void;
  onPressStoryGroup: (group: StoryGroup) => void;
  onRefresh: () => MaybePromise;
  onReport: (postId: string) => MaybePromise;
  onShare: (post: FeedPost) => void;
  onSignOut: () => MaybePromise;
  onUserPress: (nickname: string) => void;
  onVideoPress: (postId: string) => void;
  posts: FeedPost[];
  storyGroups: StoryGroup[];
  unreadChatCount: number;
  unreadCount: number;
};

export function HomeFeedList({
  bookmarkedPostIds,
  currentUserId,
  isLoadingMore,
  isRefreshing,
  likedPostIds,
  onBlockUser,
  onBookmark,
  onComment,
  onDelete,
  onLike,
  onLoadMore,
  onPressCreateStory,
  onPressMessages,
  onPressNotifications,
  onPressStoryGroup,
  onRefresh,
  onReport,
  onShare,
  onSignOut,
  onUserPress,
  onVideoPress,
  posts,
  storyGroups,
  unreadChatCount,
  unreadCount,
}: HomeFeedListProps) {
  // 화면에 가장 크게 보이는 카드만 active로 두어 피드 영상 자동재생을 제한한다.
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const firstVisibleId = viewableItems[0]?.item?.id ?? null;
      setActivePostId(firstVisibleId);
    },
  ).current;

  const leaveFeedAfterVideoDetach = useCallback((next: () => void) => {
    setActivePostId(null);
    requestAnimationFrame(next);
  }, []);

  const keyExtractor = useCallback((post: FeedPost) => post.id, []);

  const handleEndReached = useCallback(() => {
    void onLoadMore();
  }, [onLoadMore]);

  const handleRefresh = useCallback(() => {
    triggerLightHaptic();
    void onRefresh();
  }, [onRefresh]);

  const handleSignOut = useCallback(() => {
    void onSignOut();
  }, [onSignOut]);

  const handlePressCreateStory = useCallback(() => {
    leaveFeedAfterVideoDetach(onPressCreateStory);
  }, [leaveFeedAfterVideoDetach, onPressCreateStory]);

  const handlePressStoryGroup = useCallback(
    (group: StoryGroup) => {
      leaveFeedAfterVideoDetach(() => {
        onPressStoryGroup(group);
      });
    },
    [leaveFeedAfterVideoDetach, onPressStoryGroup],
  );

  const renderPost = useCallback<ListRenderItem<FeedPost>>(
    ({ item }) => (
      <FeedPostCard
        currentUserId={currentUserId}
        isActive={item.id === activePostId}
        isBookmarked={bookmarkedPostIds.has(item.id)}
        isLiked={likedPostIds.has(item.id)}
        onBlockUser={onBlockUser}
        onBookmark={onBookmark}
        onComment={onComment}
        onDelete={onDelete}
        onLike={onLike}
        onReport={onReport}
        onShare={onShare}
        onUserPress={onUserPress}
        onVideoPress={onVideoPress}
        post={item}
      />
    ),
    [
      activePostId,
      bookmarkedPostIds,
      currentUserId,
      likedPostIds,
      onBlockUser,
      onBookmark,
      onComment,
      onDelete,
      onLike,
      onReport,
      onShare,
      onUserPress,
      onVideoPress,
    ],
  );

  const listEmptyComponent = useMemo(
    () => (
      <StateView
        message="같은 학교 공개 게시물이 아직 없습니다."
        title="아직 게시물이 없습니다"
      />
    ),
    [],
  );

  const listFooterComponent = useMemo(
    () =>
      isLoadingMore ? (
        <View style={styles.loadingMore}>
          <ActivityIndicator color={colors.accent} size="small" />
        </View>
      ) : null,
    [isLoadingMore],
  );

  const listHeaderComponent = useMemo(
    () => (
      <>
        <HomeHeader
          onPressMessages={onPressMessages}
          onPressNotifications={onPressNotifications}
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
    ),
    [
      handlePressCreateStory,
      handlePressStoryGroup,
      handleSignOut,
      onPressMessages,
      onPressNotifications,
      storyGroups,
      unreadChatCount,
      unreadCount,
    ],
  );

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        tintColor={colors.accent}
      />
    ),
    [handleRefresh, isRefreshing],
  );

  return (
    <FlatList
      ListEmptyComponent={listEmptyComponent}
      ListFooterComponent={listFooterComponent}
      ListHeaderComponent={listHeaderComponent}
      contentContainerStyle={styles.listContent}
      data={posts}
      initialNumToRender={5}
      keyExtractor={keyExtractor}
      maxToRenderPerBatch={5}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.7}
      onViewableItemsChanged={handleViewableItemsChanged}
      refreshControl={refreshControl}
      removeClippedSubviews
      renderItem={renderPost}
      style={styles.list}
      viewabilityConfig={viewabilityConfig}
      windowSize={7}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 96,
  },
  loadingMore: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
});
