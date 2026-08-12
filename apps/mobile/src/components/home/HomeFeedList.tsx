import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
  type ViewToken,
} from "react-native";

import type { FeedPost, FeedPostRank } from "../../features/feed/types";
import type { StoryGroup } from "../../features/stories/types";
import {
  FEED_IMPRESSION_BATCH_SIZE,
  FEED_IMPRESSION_FLUSH_DELAY_MS,
  FEED_IMPRESSION_MINIMUM_VIEW_TIME_MS,
  FEED_IMPRESSION_VIEW_AREA_PERCENT,
} from "../../lib/constants/feedViewability";
import { triggerLightHaptic } from "../../lib/haptics";
import { useTheme, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { StateView } from "../common/StateView";
import { FeedPostCard } from "../feed/FeedPostCard";
import { StoryBar } from "../stories/StoryBar";
import { HomeHeader } from "./HomeHeader";

type MaybePromise = void | Promise<void>;

const TOP_OFFSET_THRESHOLD = 8;

export type HomeFeedListHandle = {
  isAtTop: () => boolean;
  scrollToTop: () => void;
};

type HomeFeedListProps = {
  bookmarkedPostIds: Set<string>;
  canCreateStory: boolean;
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
  onPostImpressions: (postIds: string[]) => MaybePromise;
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
  postRanks: Map<string, FeedPostRank>;
  posts: FeedPost[];
  storyGroups: StoryGroup[];
  unreadChatCount: number;
  unreadCount: number;
};

type FeedListPostItem = {
  post: FeedPost;
  type: "post";
};

type FeedListReadMarkerItem = {
  id: "all-read-marker";
  type: "read-marker";
};

type HomeFeedListItem = FeedListPostItem | FeedListReadMarkerItem;

function isFeedListPostItem(item: unknown): item is FeedListPostItem {
  return (
    typeof item === "object" &&
    item !== null &&
    "type" in item &&
    item.type === "post" &&
    "post" in item
  );
}

function getPostIdFromViewToken(token: ViewToken): string | null {
  return isFeedListPostItem(token.item) ? token.item.post.id : null;
}

export const HomeFeedList = forwardRef<HomeFeedListHandle, HomeFeedListProps>(
function HomeFeedList({
  bookmarkedPostIds,
  canCreateStory,
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
  onPostImpressions,
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
  postRanks,
  posts,
  storyGroups,
  unreadChatCount,
  unreadCount,
}: HomeFeedListProps, ref) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  // 화면에 가장 크게 보이는 카드만 active로 두어 피드 영상 자동재생을 제한한다.
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<HomeFeedListItem> | null>(null);
  const scrollOffsetRef = useRef(0);
  const onPostImpressionsRef = useRef(onPostImpressions);
  const pendingImpressionIdsRef = useRef<Set<string>>(new Set());
  const sentImpressionIdsRef = useRef<Set<string>>(new Set());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushPendingImpressionsRef = useRef<() => void>(() => undefined);
  const scheduleImpressionFlushRef = useRef<() => void>(() => undefined);
  const activeViewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;
  const impressionViewabilityConfig = useRef({
    minimumViewTime: FEED_IMPRESSION_MINIMUM_VIEW_TIME_MS,
    viewAreaCoveragePercentThreshold: FEED_IMPRESSION_VIEW_AREA_PERCENT,
  }).current;
  const handleActiveViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const firstVisibleId =
        viewableItems.map(getPostIdFromViewToken).find((postId) => postId) ??
        null;
      setActivePostId(firstVisibleId);
    },
  ).current;
  const handleImpressionViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      viewableItems.forEach((token) => {
        const postId = getPostIdFromViewToken(token);

        if (!postId || sentImpressionIdsRef.current.has(postId)) {
          return;
        }

        pendingImpressionIdsRef.current.add(postId);
      });

      if (pendingImpressionIdsRef.current.size >= FEED_IMPRESSION_BATCH_SIZE) {
        flushPendingImpressionsRef.current();
        return;
      }

      if (pendingImpressionIdsRef.current.size > 0) {
        scheduleImpressionFlushRef.current();
      }
    },
  ).current;
  const viewabilityConfigCallbackPairs = useRef([
    {
      onViewableItemsChanged: handleActiveViewableItemsChanged,
      viewabilityConfig: activeViewabilityConfig,
    },
    {
      onViewableItemsChanged: handleImpressionViewableItemsChanged,
      viewabilityConfig: impressionViewabilityConfig,
    },
  ]).current;

  onPostImpressionsRef.current = onPostImpressions;

  useImperativeHandle(
    ref,
    () => ({
      isAtTop: () => scrollOffsetRef.current <= TOP_OFFSET_THRESHOLD,
      scrollToTop: () => {
        flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
      },
    }),
    [],
  );

  flushPendingImpressionsRef.current = () => {
    const postIds = Array.from(pendingImpressionIdsRef.current).filter(
      (postId) => !sentImpressionIdsRef.current.has(postId),
    );

    if (postIds.length === 0) {
      pendingImpressionIdsRef.current.clear();
      return;
    }

    pendingImpressionIdsRef.current.clear();
    postIds.forEach((postId) => {
      sentImpressionIdsRef.current.add(postId);
    });
    void onPostImpressionsRef.current(postIds);
  };

  scheduleImpressionFlushRef.current = () => {
    if (flushTimerRef.current) {
      return;
    }

    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      flushPendingImpressionsRef.current();
    }, FEED_IMPRESSION_FLUSH_DELAY_MS);
  };

  useEffect(
    () => () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      flushPendingImpressionsRef.current();
    },
    [],
  );

  const leaveFeedAfterVideoDetach = useCallback((next: () => void) => {
    setActivePostId(null);
    requestAnimationFrame(next);
  }, []);

  const feedItems = useMemo<HomeFeedListItem[]>(() => {
    const items: HomeFeedListItem[] = [];
    let didInsertReadMarker = false;

    posts.forEach((post) => {
      if (!didInsertReadMarker && postRanks.get(post.id)?.band === 2) {
        items.push({ id: "all-read-marker", type: "read-marker" });
        didInsertReadMarker = true;
      }

      items.push({ post, type: "post" });
    });

    return items;
  }, [postRanks, posts]);

  const keyExtractor = useCallback((item: HomeFeedListItem) => {
    return item.type === "post" ? item.post.id : item.id;
  }, []);

  const handleEndReached = useCallback(() => {
    void onLoadMore();
  }, [onLoadMore]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
    },
    [],
  );

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

  const renderItem = useCallback<ListRenderItem<HomeFeedListItem>>(
    ({ item }) => {
      if (item.type === "read-marker") {
        return (
          <View style={styles.readMarker}>
            <Text style={styles.readMarkerText}>모두 열람했습니다</Text>
          </View>
        );
      }

      const { post } = item;

      return (
        <FeedPostCard
          currentUserId={currentUserId}
          isActive={post.id === activePostId}
          isBookmarked={bookmarkedPostIds.has(post.id)}
          isLiked={likedPostIds.has(post.id)}
          onBlockUser={onBlockUser}
          onBookmark={onBookmark}
          onComment={onComment}
          onDelete={onDelete}
          onLike={onLike}
          onReport={onReport}
          onShare={onShare}
          onUserPress={onUserPress}
          onVideoPress={onVideoPress}
          post={post}
        />
      );
    },
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
      styles,
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
    [colors.accent, isLoadingMore, styles],
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
          canCreateStory={canCreateStory}
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
      canCreateStory,
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
    [colors.accent, handleRefresh, isRefreshing],
  );

  return (
    <FlatList
      ListEmptyComponent={listEmptyComponent}
      ListFooterComponent={listFooterComponent}
      ListHeaderComponent={listHeaderComponent}
      contentContainerStyle={styles.listContent}
      data={feedItems}
      initialNumToRender={5}
      keyExtractor={keyExtractor}
      maxToRenderPerBatch={5}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.7}
      onScroll={handleScroll}
      ref={flatListRef}
      refreshControl={refreshControl}
      removeClippedSubviews
      renderItem={renderItem}
      scrollEventThrottle={64}
      style={styles.list}
      viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
      windowSize={7}
    />
  );
});

const makeStyles = (c: ThemeColors) => StyleSheet.create({
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
  readMarker: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  readMarkerText: {
    color: c.textFaint,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
  },
});
