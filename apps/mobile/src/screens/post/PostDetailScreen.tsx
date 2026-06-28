import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CommentsSheet } from "../../components/comments/CommentsSheet";
import { ScreenHeader } from "../../components/common/ScreenHeader";
import { StateView } from "../../components/common/StateView";
import { FeedPostCard } from "../../components/feed/FeedPostCard";
import { usePostDetail } from "../../features/feed/usePostDetail";
import { useSession } from "../../lib/session";
import { colors } from "../../lib/theme";

type PostDetailScreenProps = {
  postId: string;
};

export function PostDetailScreen({ postId }: PostDetailScreenProps) {
  const router = useRouter();
  const { session } = useSession();
  const currentUserId = session?.user.id ?? "";
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const {
    blockPostUser,
    deletePostById,
    errorMessage,
    feedbackMessage,
    handleCommentCountChange,
    handleToggleBookmark,
    handleToggleLike,
    isBookmarked,
    isLiked,
    isLoading,
    post,
    reportPost,
    retry,
  } = usePostDetail(postId);

  const handleBlockUser = useCallback(
    async (userId: string) => {
      const blocked = await blockPostUser(userId);
      if (blocked) {
        router.back();
      }
    },
    [blockPostUser, router],
  );

  const handleDeletePost = useCallback(
    async (deletedPostId: string) => {
      const deleted = await deletePostById(deletedPostId);
      if (deleted) {
        setTimeout(() => {
          router.back();
        }, 250);
      }
    },
    [deletePostById, router],
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
          onAction={retry}
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
            onDelete={(deletedPostId) => {
              void handleDeletePost(deletedPostId);
            }}
            onLike={() => {
              void handleToggleLike();
            }}
            onReport={(reportedPostId) => {
              void reportPost(reportedPostId);
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
