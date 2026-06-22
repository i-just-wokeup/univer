import { Bookmark, Heart, MessageCircle, MoreHorizontal } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "../common/Avatar";
import { FeedMediaCarousel } from "./FeedMediaCarousel";
import { colors } from "../../lib/theme";
import type { FeedPost } from "../../features/feed/types";

type FeedPostCardProps = {
  isLiked: boolean;
  onComment: (postId: string) => void;
  onLike: (postId: string) => void;
  post: FeedPost;
};

function formatCount(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}천`;
  }

  return `${count}`;
}

function getRelativeTimeLabel(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < hourMs) {
    return `${Math.max(1, Math.floor(diffMs / minuteMs))}분 전`;
  }

  if (diffMs < dayMs) {
    return `${Math.max(1, Math.floor(diffMs / hourMs))}시간 전`;
  }

  return `${Math.max(1, Math.floor(diffMs / dayMs))}일 전`;
}

export function FeedPostCard({
  isLiked,
  onComment,
  onLike,
  post,
}: FeedPostCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar imageUrl={post.user.avatar_url} label={post.user.nickname} size={42} />
        <View style={styles.userText}>
          <Text numberOfLines={1} style={styles.metaLine}>
            <Text style={styles.nickname}>{post.user.nickname}</Text>
            <Text style={styles.metaText}> · {post.user.department}</Text>
            <Text style={styles.metaText}> · {getRelativeTimeLabel(post.created_at)}</Text>
          </Text>
        </View>
        <MoreHorizontal color={colors.textFaint} size={26} strokeWidth={2.7} />
      </View>

      <FeedMediaCarousel aspectRatio={post.aspect_ratio} media={post.media} />

      <View style={styles.actionRow}>
        <View style={styles.leftActions}>
          <Pressable onPress={() => onLike(post.id)} style={styles.actionButton}>
            <Heart
              color={isLiked ? colors.danger : colors.text}
              fill={isLiked ? colors.danger : "transparent"}
              size={33}
              strokeWidth={2.5}
            />
            <Text style={styles.actionText}>{formatCount(post.likes_count)}</Text>
          </Pressable>
          <Pressable
            onPress={() => onComment(post.id)}
            style={styles.actionButton}
          >
            <MessageCircle color={colors.text} size={29} strokeWidth={2.5} />
            <Text style={styles.actionText}>{formatCount(post.comments_count)}</Text>
          </Pressable>
        </View>
        <Bookmark color={colors.text} size={30} strokeWidth={2.5} />
      </View>

      {post.content ? (
        <Text numberOfLines={3} style={styles.content}>
          <Text style={styles.contentNickname}>{post.user.nickname} </Text>
          {post.content}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  userText: {
    flex: 1,
  },
  metaLine: {
    color: colors.textFaint,
    fontSize: 14,
    fontWeight: "700",
  },
  nickname: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  metaText: {
    color: colors.textFaint,
    fontSize: 14,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  contentNickname: {
    fontWeight: "900",
  },
});
