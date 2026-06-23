import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StateView } from "../../components/common/StateView";
import { CommentsSheet } from "../../components/comments/CommentsSheet";
import { FeedPostCard } from "../../components/feed/FeedPostCard";
import { HomeHeader } from "../../components/home/HomeHeader";
import { StoryBar } from "../../components/stories/StoryBar";
import { getFeed, getLikedPostIds, togglePostLike } from "../../features/feed/api";
import type { FeedPost } from "../../features/feed/types";
import { getUnreadCount } from "../../features/notifications/api";
import { getStories } from "../../features/stories/api";
import type { StoryGroup } from "../../features/stories/types";
import { getSupabaseMobileClient } from "../../lib/supabase";
import { colors } from "../../lib/theme";

export function HomeScreen() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentSheetPostId, setCommentSheetPostId] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(() => new Set());
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pendingLikePostIdsRef = useRef<Set<string>>(new Set());

  const loadHomeMeta = useCallback(async () => {
    try {
      setStoryGroups(await getStories());
    } catch {
      // 스토리바 로딩 실패는 피드 사용을 막지 않는다.
    }

    try {
      setUnreadCount(await getUnreadCount());
    } catch {
      // 안읽은 알림 수 로딩 실패는 무시한다.
    }
  }, []);

  // 화면에 다시 진입할 때마다(작성/뷰어/알림에서 복귀 포함) 스토리바·알림 뱃지를 갱신한다.
  useFocusEffect(
    useCallback(() => {
      void loadHomeMeta();
    }, [loadHomeMeta]),
  );

  const loadFirstPage = useCallback(async () => {
    try {
      setErrorMessage("");
      const result = await getFeed();
      const likedIds = await getLikedPostIds(result.posts.map((post) => post.id));

      setPosts(result.posts);
      setNextCursor(result.nextCursor);
      setLikedPostIds(new Set(likedIds));
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

  async function handleLoadMore() {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const result = await getFeed({ cursor: nextCursor });
      const likedIds = await getLikedPostIds(result.posts.map((post) => post.id));

      setPosts((currentPosts) => [...currentPosts, ...result.posts]);
      setNextCursor(result.nextCursor);
      setLikedPostIds((currentLikedPostIds) => {
        const nextLikedPostIds = new Set(currentLikedPostIds);
        likedIds.forEach((postId) => {
          nextLikedPostIds.add(postId);
        });
        return nextLikedPostIds;
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

  async function handleSignOut() {
    await getSupabaseMobileClient().auth.signOut();
  }

  const handleCommentCountChange = useCallback((postId: string, nextCount: number) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId ? { ...post, comments_count: nextCount } : post,
      ),
    );
  }, []);

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

  const handlePressStoryGroup = useCallback(
    (group: StoryGroup) => {
      router.push({
        pathname: "/story/[userId]",
        params: { userId: group.user.id },
      });
    },
    [router],
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
              onPressNotifications={handlePressNotifications}
              onSignOut={handleSignOut}
              unreadCount={unreadCount}
            />
        <StateView
          actionLabel="다시 시도"
          message={errorMessage}
          onAction={() => {
            setIsInitialLoading(true);
            void loadFirstPage();
          }}
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
              onPressNotifications={handlePressNotifications}
              onSignOut={handleSignOut}
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
            isLiked={likedPostIds.has(item.id)}
            onComment={setCommentSheetPostId}
            onLike={(postId) => {
              void handleToggleLike(postId);
            }}
            onUserPress={handleUserPress}
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
      <CommentsSheet
        isOpen={Boolean(commentSheetPostId)}
        onClose={() => {
          setCommentSheetPostId(null);
        }}
        onCommentCountChange={handleCommentCountChange}
        onUserPress={handleCommentUserPress}
        postId={commentSheetPostId}
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
});
