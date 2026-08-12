import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { StorySharedPost } from "../../features/stories/types";
import { colors, fontSize, fontWeight } from "../../lib/theme";
import { StorySharedPostMedia } from "./StorySharedPostMedia";

type StorySharedPostCardProps = {
  isActive?: boolean;
  isPaused?: boolean;
  onPress?: () => void;
  post: StorySharedPost | null;
};

export function StorySharedPostCard({
  isActive = false,
  isPaused = false,
  onPress,
  post,
}: StorySharedPostCardProps) {
  if (!post) {
    return (
      <View style={[styles.card, styles.deletedCard]}>
        <Text style={styles.deletedTitle}>삭제된 게시물</Text>
        <Text style={styles.deletedDescription}>
          원본 게시물을 더 이상 볼 수 없습니다.
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={`${post.user.nickname}의 게시물 보기`}
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && onPress ? styles.pressed : null,
      ]}
    >
      <View style={styles.authorRow}>
        <View
          accessibilityLabel={`${post.user.nickname} 프로필 이미지`}
          accessibilityRole="image"
          style={styles.avatar}
        >
          {post.user.avatar_url ? (
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              source={{ uri: post.user.avatar_url }}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
        </View>
        <Text numberOfLines={1} style={styles.nickname}>
          {post.user.nickname}
        </Text>
      </View>

      <StorySharedPostMedia
        isActive={isActive}
        isPaused={isPaused}
        post={post}
      />

      {post.content ? (
        <Text numberOfLines={1} style={styles.caption}>
          {post.content}
        </Text>
      ) : null}
      <Text style={styles.hint}>게시물 보기</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "78%",
    maxWidth: 340,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: colors.white,
  },
  pressed: {
    opacity: 0.78,
  },
  authorRow: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  avatar: {
    height: 32,
    width: 32,
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  avatarPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.black,
    opacity: 0.16,
  },
  nickname: {
    minWidth: 0,
    flexShrink: 1,
    color: colors.black,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semibold,
  },
  caption: {
    marginTop: 10,
    paddingHorizontal: 12,
    color: colors.black,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },
  hint: {
    marginTop: 7,
    paddingHorizontal: 12,
    paddingBottom: 12,
    color: colors.black,
    opacity: 0.58,
    fontSize: fontSize.label,
    fontWeight: fontWeight.semibold,
  },
  deletedCard: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: 12,
  },
  deletedTitle: {
    color: colors.black,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.bold,
  },
  deletedDescription: {
    color: colors.black,
    opacity: 0.58,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    textAlign: "center",
  },
});
