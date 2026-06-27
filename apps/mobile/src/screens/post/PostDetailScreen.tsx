import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CommentsSheet } from "../../components/comments/CommentsSheet";
import { ScreenHeader } from "../../components/common/ScreenHeader";
import { StateView } from "../../components/common/StateView";
import { FeedPostCard } from "../../components/feed/FeedPostCard";
import { blockUser } from "../../features/blocks/api";
import {
  getBookmarkedPostIds,
  getLikedPostIds,
  getPost,
  toggleBookmark,
  togglePostLike,
} from "../../features/feed/api";
import type { FeedPost } from "../../features/feed/types";
import { createReport } from "../../features/reports/api";
import { useSession } from "../../lib/session";
import { colors } from "../../lib/theme";

type PostDetailScreenProps = {
  postId: string;
};

export function PostDetailScreen({ postId }: PostDetailScreenProps) {
  const router = useRouter();
  const { session } = useSession();
  const currentUserId = session?.user.id ?? "";
  const [post, setPost] = useState<FeedPost | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingBookmarkRef = useRef(false);
  const pendingLikeRef = useRef(false);

  const showFeedback = useCallback((message: string) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    setFeedbackMessage(message);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackMessage("");
      feedbackTimerRef.current = null;
    }, 1800);
  }, []);

  const load = useCallback(async () => {
    try {
      setErrorMessage("");
      const [loadedPost, likedIds, bookmarkedIds] = await Promise.all([
        getPost(postId),
        getLikedPostIds([postId]),
        getBookmarkedPostIds([postId]),
      ]);
      setPost(loadedPost);
      setIsLiked(likedIds.includes(postId));
      setIsBookmarked(bookmarkedIds.includes(postId));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "게시물을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const handleToggleLike = useCallback(async () => {
    if (pendingLikeRef.current) {
      return;
    }

    pendingLikeRef.current = true;

    try {
      const result = await togglePostLike(postId);
      setPost((current) =>
        current ? { ...current, likes_count: result.likesCount } : current,
      );
      setIsLiked(result.liked);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "좋아요를 처리하지 못했습니다.",
      );
    } finally {
      pendingLikeRef.current = false;
    }
  }, [postId]);

  const handleToggleBookmark = useCallback(async () => {
    if (pendingBookmarkRef.current) {
      return;
    }

    pendingBookmarkRef.current = true;
    const wasBookmarked = isBookmarked;
    setIsBookmarked(!wasBookmarked);

    try {
      const result = await toggleBookmark(postId);
      setIsBookmarked(result.bookmarked);
      showFeedback(result.bookmarked ? "게시물을 저장했어요" : "저장을 취소했어요");
    } catch (error) {
      setIsBookmarked(wasBookmarked);
      showFeedback(
        error instanceof Error ? error.message : "저장을 처리하지 못했습니다.",
      );
    } finally {
      pendingBookmarkRef.current = false;
    }
  }, [isBookmarked, postId, showFeedback]);

  const handleBlockUser = useCallback(
    async (userId: string) => {
      try {
        await blockUser(userId);
        showFeedback("차단했어요");
        router.back();
      } catch (error) {
        showFeedback(
          error instanceof Error ? error.message : "차단에 실패했습니다.",
        );
      }
    },
    [router, showFeedback],
  );

  const handleReportPost = useCallback(
    async (reportedPostId: string) => {
      try {
        await createReport({ targetId: reportedPostId, targetType: "post" });
        showFeedback("신고가 접수됐어요");
      } catch (error) {
        showFeedback(
          error instanceof Error ? error.message : "신고에 실패했습니다.",
        );
      }
    },
    [showFeedback],
  );

  const handleCommentCountChange = useCallback(
    (changedPostId: string, nextCount: number) => {
      setPost((current) =>
        current && current.id === changedPostId
          ? { ...current, comments_count: nextCount }
          : current,
      );
    },
    [],
  );

  const handleUserPress = useCallback(
    (nickname: string) => {
      router.push({ pathname: "/profile/[nickname]", params: { nickname } });
    },
    [router],
  );

  const handleCommentUserPress = useCallback(
    (nickname: string) => {
      setIsCommentSheetOpen(false);
      handleUserPress(nickname);
    },
    [handleUserPress],
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScreenHeader onBack={() => router.back()} title="게시물" />

      {isLoading ? (
        <StateView
          message="게시물을 불러오는 중입니다."
          title="게시물 준비 중"
          type="loading"
        />
      ) : errorMessage && !post ? (
        <StateView
          actionLabel="다시 시도"
          message={errorMessage}
          onAction={() => {
            setIsLoading(true);
            void load();
          }}
          title="게시물을 불러오지 못했습니다"
          type="error"
        />
      ) : post ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <FeedPostCard
            currentUserId={currentUserId}
            isBookmarked={isBookmarked}
            isLiked={isLiked}
            onBlockUser={(userId) => {
              void handleBlockUser(userId);
            }}
            onBookmark={() => {
              void handleToggleBookmark();
            }}
            onComment={() => setIsCommentSheetOpen(true)}
            onLike={() => {
              void handleToggleLike();
            }}
            onReport={(reportedPostId) => {
              void handleReportPost(reportedPostId);
            }}
            onUserPress={handleUserPress}
            post={post}
          />
        </ScrollView>
      ) : null}

      {feedbackMessage ? (
        <View style={styles.feedback}>
          <Text style={styles.feedbackText}>{feedbackMessage}</Text>
        </View>
      ) : null}

      <CommentsSheet
        isOpen={isCommentSheetOpen}
        onClose={() => setIsCommentSheetOpen(false)}
        onCommentCountChange={handleCommentCountChange}
        onUserPress={handleCommentUserPress}
        postId={post ? post.id : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  feedback: {
    position: "absolute",
    right: 16,
    bottom: 24,
    left: 16,
    borderRadius: 16,
    backgroundColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  feedbackText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
});
