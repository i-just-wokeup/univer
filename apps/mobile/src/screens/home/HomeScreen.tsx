import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
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
import { getChatUnreadCount } from "../../features/chat/api";
import { useHomeFeed } from "../../features/feed/useHomeFeed";
import { getUnreadCount } from "../../features/notifications/api";
import { getStories } from "../../features/stories/api";
import type { StoryGroup } from "../../features/stories/types";
import { useSession } from "../../lib/session";
import { getSupabaseMobileClient } from "../../lib/supabase";
import { colors } from "../../lib/theme";

export function HomeScreen() {
  const router = useRouter();
  const { session } = useSession();
  const currentUserId = session?.user.id ?? "";
  const [commentSheetPostId, setCommentSheetPostId] = useState<string | null>(null);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
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
  } = useHomeFeed();

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

  async function handleSignOut() {
    await getSupabaseMobileClient().auth.signOut();
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
            onDelete={(postId) => {
              void handleDeletePost(postId);
            }}
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
