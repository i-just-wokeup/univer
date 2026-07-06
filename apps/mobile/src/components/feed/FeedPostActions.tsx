import { Bookmark, Heart, MessageCircle, Send } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../lib/theme";
import type { FeedPost } from "../../features/feed/types";

type FeedPostActionsProps = {
  hasContent: boolean;
  isBookmarked: boolean;
  isLiked: boolean;
  onBookmark?: (postId: string) => void;
  onComment: (postId: string) => void;
  onLike: (postId: string) => void;
  onShare?: (post: FeedPost) => void;
  post: FeedPost;
};

function formatCount(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}천`;
  }

  return `${count}`;
}

export function FeedPostActions({
  hasContent,
  isBookmarked,
  isLiked,
  onBookmark,
  onComment,
  onLike,
  onShare,
  post,
}: FeedPostActionsProps) {
  return (
    <View style={[styles.actionRow, hasContent ? styles.actionRowTight : null]}>
      <View style={styles.leftActions}>
        <Pressable onPress={() => onLike(post.id)} style={styles.actionButton}>
          <Heart
            color={isLiked ? colors.danger : colors.text}
            fill={isLiked ? colors.danger : "transparent"}
            size={26}
            strokeWidth={2}
          />
          <Text style={styles.actionText}>{formatCount(post.likes_count)}</Text>
        </Pressable>
        <Pressable
          onPress={() => onComment(post.id)}
          style={styles.actionButton}
        >
          <MessageCircle color={colors.text} size={25} strokeWidth={2} />
          <Text style={styles.actionText}>
            {formatCount(post.comments_count)}
          </Text>
        </Pressable>
        {onShare ? (
          <Pressable
            accessibilityLabel="게시물 공유"
            accessibilityRole="button"
            onPress={() => onShare(post)}
            style={styles.actionButton}
          >
            <Send color={colors.text} size={23} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>
      <Pressable
        accessibilityLabel={isBookmarked ? "저장 취소" : "게시물 저장"}
        accessibilityRole="button"
        onPress={() => onBookmark?.(post.id)}
        style={({ pressed }) => [
          styles.bookmarkButton,
          pressed ? styles.pressed : null,
        ]}
      >
        <Bookmark
          color={colors.text}
          fill={isBookmarked ? colors.text : "transparent"}
          size={25}
          strokeWidth={2}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 9,
    paddingBottom: 11,
  },
  // 본문 있는 글은 아이콘과 본문을 더 붙인다(본문 없는 글은 위 11 여백 유지).
  actionRowTight: {
    paddingBottom: 6,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  bookmarkButton: {
    minHeight: 40,
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.62,
  },
});
