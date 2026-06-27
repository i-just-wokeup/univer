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
import { blockUser } from "../../features/blocks/api";
import { getChatUnreadCount } from "../../features/chat/api";
import {
  getBookmarkedPostIds,
  getFeed,
  getLikedPostIds,
  toggleBookmark,
  togglePostLike,
} from "../../features/feed/api";
import type { FeedPost } from "../../features/feed/types";
import { getUnreadCount } from "../../features/notifications/api";
import { createReport } from "../../features/reports/api";
import { getStories } from "../../features/stories/api";
import type { StoryGroup } from "../../features/stories/types";
import { useSession } from "../../lib/session";
import { getSupabaseMobileClient } from "../../lib/supabase";
import { colors } from "../../lib/theme";

type FeedbackType = "error" | "success";

type FeedbackState = {
  message: string;
  type: FeedbackType;
} | null;

export function HomeScreen() {
  const router = useRouter();
  const { session } = useSession();
  const currentUserId = session?.user.id ?? "";
  const [errorMessage, setErrorMessage] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [commentSheetPostId, setCommentSheetPostId] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(() => new Set());
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingBookmarkPostIdsRef = useRef<Set<string>>(new Set());
  const pendingLikePostIdsRef = useRef<Set<string>>(new Set());

  const showFeedback = useCallback((message: string, type: FeedbackType) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    setFeedback({ message, type });
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
      feedbackTimerRef.current = null;
    }, 1800);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

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

    try {
      setUnreadChatCount(await getChatUnreadCount());
    } catch {
      // 안읽은 메시지 수 로딩 실패는 무시한다.
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
      const postIds = result.posts.map((post) => post.id);
      const [likedIds, bookmarkedIds] = await Promise.all([
        getLikedPostIds(postIds),
        getBookmarkedPostIds(postIds),
      ]);

      setPosts(result.posts);
      setNextCursor(result.nextCursor);
      setLikedPostIds(new Set(likedIds));
      setBookmarkedPostIds(new Set(bookmarkedIds));
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
      const postIds = result.posts.map((post) => post.id);
      const [likedIds, bookmarkedIds] = await Promise.all([
        getLikedPostIds(postIds),
        getBookmarkedPostIds(postIds),
      ]);

      setPosts((currentPosts) => [...currentPosts, ...result.posts]);
      setNextCursor(result.nextCursor);
      setLikedPostIds((currentLikedPostIds) => {
        const nextLikedPostIds = new Set(currentLikedPostIds);
        likedIds.forEach((postId) => {
          nextLikedPostIds.add(postId);
        });
        return nextLikedPostIds;
      });
      setBookmarkedPostIds((currentBookmarkedPostIds) => {
        const nextBookmarkedPostIds = new Set(currentBookmarkedPostIds);
        bookmarkedIds.forEach((postId) => {
          nextBookmarkedPostIds.add(postId);
        });
        return nextBookmarkedPostIds;
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

  async function handleToggleBookmark(postId: string) {
    if (pendingBookmarkPostIdsRef.current.has(postId)) {
      return;
    }

    pendingBookmarkPostIdsRef.current.add(postId);
    const wasBookmarked = bookmarkedPostIds.has(postId);

    setBookmarkedPostIds((currentBookmarkedPostIds) => {
      const nextBookmarkedPostIds = new Set(currentBookmarkedPostIds);

      if (wasBookmarked) {
        nextBookmarkedPostIds.delete(postId);
      } else {
        nextBookmarkedPostIds.add(postId);
      }

      return nextBookmarkedPostIds;
    });

    try {
      const result = await toggleBookmark(postId);

      setBookmarkedPostIds((currentBookmarkedPostIds) => {
        const nextBookmarkedPostIds = new Set(currentBookmarkedPostIds);

        if (result.bookmarked) {
          nextBookmarkedPostIds.add(postId);
        } else {
          nextBookmarkedPostIds.delete(postId);
        }

        return nextBookmarkedPostIds;
      });
      showFeedback(result.bookmarked ? "게시물을 저장했어요" : "저장을 취소했어요", "success");
    } catch (error) {
      setBookmarkedPostIds((currentBookmarkedPostIds) => {
        const nextBookmarkedPostIds = new Set(currentBookmarkedPostIds);

        if (wasBookmarked) {
          nextBookmarkedPostIds.add(postId);
        } else {
          nextBookmarkedPostIds.delete(postId);
        }

        return nextBookmarkedPostIds;
      });
      showFeedback(
        error instanceof Error ? error.message : "저장을 처리하지 못했습니다.",
        "error",
      );
    } finally {
      pendingBookmarkPostIdsRef.current.delete(postId);
    }
  }

  async function handleBlockUser(userId: string) {
    try {
      await blockUser(userId);
      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.user.id !== userId),
      );
      showFeedback("차단했어요", "success");
    } catch (error) {
      showFeedback(
        error instanceof Error ? error.message : "차단에 실패했습니다.",
        "error",
      );
    }
  }

  async function handleReportPost(postId: string) {
    try {
      await createReport({ targetId: postId, targetType: "post" });
      showFeedback("신고가 접수됐어요", "success");
    } catch (error) {
      showFeedback(
        error instanceof Error ? error.message : "신고에 실패했습니다.",
        "error",
      );
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
            isBookmarked={bookmarkedPostIds.has(item.id)}
            isLiked={likedPostIds.has(item.id)}
            onBlockUser={(userId) => {
              void handleBlockUser(userId);
            }}
            onBookmark={(postId) => {
              void handleToggleBookmark(postId);
            }}
            onComment={setCommentSheetPostId}
            onLike={(postId) => {
              void handleToggleLike(postId);
            }}
            onReport={(postId) => {
              void handleReportPost(postId);
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
