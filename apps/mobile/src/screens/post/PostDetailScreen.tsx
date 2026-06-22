import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CommentsSheet } from "../../components/comments/CommentsSheet";
import { StateView } from "../../components/common/StateView";
import { FeedPostCard } from "../../components/feed/FeedPostCard";
import {
  getLikedPostIds,
  getPost,
  togglePostLike,
} from "../../features/feed/api";
import type { FeedPost } from "../../features/feed/types";
import { colors } from "../../lib/theme";

type PostDetailScreenProps = {
  postId: string;
};

export function PostDetailScreen({ postId }: PostDetailScreenProps) {
  const router = useRouter();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const pendingLikeRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setErrorMessage("");
      const [loadedPost, likedIds] = await Promise.all([
        getPost(postId),
        getLikedPostIds([postId]),
      ]);
      setPost(loadedPost);
      setIsLiked(likedIds.includes(postId));
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
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <ChevronLeft color={colors.text} size={22} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.headerTitle}>게시물</Text>
        <View style={styles.headerButton} />
      </View>

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
            isLiked={isLiked}
            onComment={() => setIsCommentSheetOpen(true)}
            onLike={() => {
              void handleToggleLike();
            }}
            onUserPress={handleUserPress}
            post={post}
          />
        </ScrollView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 12,
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
});
