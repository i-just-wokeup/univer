import { Image } from "expo-image";
import { Play } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { StorySharedPost } from "../../features/stories/types";
import { getStorySharedPostThumbnail } from "../../features/stories/storySharedPosts";
import { useTheme, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { Avatar } from "../common/Avatar";

type StorySharedPostCardProps = {
  onPress?: () => void;
  post: StorySharedPost | null;
};

export function StorySharedPostCard({
  onPress,
  post,
}: StorySharedPostCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const thumbnailUrl = getStorySharedPostThumbnail(post);

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
        <Avatar
          imageUrl={post.user.avatar_url}
          label={post.user.nickname}
          size={32}
        />
        <Text numberOfLines={1} style={styles.nickname}>
          {post.user.nickname}
        </Text>
      </View>

      <View style={styles.media}>
        {thumbnailUrl ? (
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            recyclingKey={`${post.id}:${thumbnailUrl}`}
            source={{ uri: thumbnailUrl }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={styles.mediaPlaceholder} />
        )}
        {post.media?.type === "video" ? (
          <View style={styles.playBadge}>
            <Play
              color={colors.white}
              fill={colors.white}
              size={22}
              strokeWidth={2}
            />
          </View>
        ) : null}
      </View>

      {post.content ? (
        <Text numberOfLines={1} style={styles.caption}>
          {post.content}
        </Text>
      ) : null}
      <Text style={styles.hint}>게시물 보기</Text>
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    width: "78%",
    maxWidth: 340,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: c.navBackground,
    padding: 12,
  },
  pressed: {
    opacity: 0.78,
  },
  authorRow: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingBottom: 10,
  },
  nickname: {
    minWidth: 0,
    flexShrink: 1,
    color: c.text,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semibold,
  },
  media: {
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: c.imagePlaceholder,
  },
  mediaPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: c.imagePlaceholder,
  },
  playBadge: {
    height: 48,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: c.scrimStrong,
  },
  caption: {
    marginTop: 10,
    color: c.text,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },
  hint: {
    marginTop: 7,
    color: c.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.semibold,
  },
  deletedCard: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  deletedTitle: {
    color: c.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.bold,
  },
  deletedDescription: {
    color: c.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    textAlign: "center",
  },
});
