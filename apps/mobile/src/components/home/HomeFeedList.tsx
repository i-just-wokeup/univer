import { useRef, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  type ViewToken,
} from "react-native";

import type { FeedPost } from "../../features/feed/types";
import type { StoryGroup } from "../../features/stories/types";
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

  function leaveFeedAfterVideoDetach(next: () => void) {
    setActivePostId(null);
    requestAnimationFrame(next);
  }

  return (
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
            onPressMessages={onPressMessages}
            onPressNotifications={onPressNotifications}
            onSignOut={() => {
              void onSignOut();
            }}
            unreadChatCount={unreadChatCount}
            unreadCount={unreadCount}
          />
          <StoryBar
            groups={storyGroups}
            onPressCreate={() => {
              leaveFeedAfterVideoDetach(onPressCreateStory);
            }}
            onPressGroup={(group) => {
              leaveFeedAfterVideoDetach(() => {
                onPressStoryGroup(group);
              });
            }}
          />
        </>
      }
      contentContainerStyle={styles.listContent}
      data={posts}
      keyExtractor={(post) => post.id}
      onEndReached={() => {
        void onLoadMore();
      }}
      onEndReachedThreshold={0.7}
      onViewableItemsChanged={handleViewableItemsChanged}
      refreshControl={
        <RefreshControl
          onRefresh={() => {
            void onRefresh();
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
            void onBlockUser(userId);
          }}
          onBookmark={(postId) => {
            void onBookmark(postId);
          }}
          onComment={onComment}
          onDelete={(postId) => {
            void onDelete(postId);
          }}
          onLike={(postId) => {
            void onLike(postId);
          }}
          onReport={(postId) => {
            void onReport(postId);
          }}
          onShare={onShare}
          onUserPress={onUserPress}
          onVideoPress={onVideoPress}
          post={item}
        />
      )}
      style={styles.list}
      viewabilityConfig={viewabilityConfig}
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
});
