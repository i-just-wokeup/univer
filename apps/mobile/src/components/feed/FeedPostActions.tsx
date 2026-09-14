import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "../common/Icon";
import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
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

  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.actionRow, hasContent ? styles.actionRowTight : null]}>
      <View style={styles.leftActions}>
        <Pressable onPress={() => onLike(post.id)} style={styles.actionButton}>
          {/* 의도: strokeWidth 2는 2026-07-03 "인스타식 축소"로 2.6에서 내린 값이다.
              굵기 통일 작업이 2.4 등으로 되돌리면 안 된다 */}
          <Icon
            name="heart"
            size="lg"
            stroke="thin"
            tone={isLiked ? "danger" : "text"}
            filled={isLiked}
          />
          <Text style={styles.actionText}>{formatCount(post.likes_count)}</Text>
        </Pressable>
        <Pressable
          onPress={() => onComment(post.id)}
          style={styles.actionButton}
        >
          <Icon name="messageCircle" size="lg" stroke="thin" tone="text" />
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
            <Icon name="send" size="md" stroke="thin" tone="text" />
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
        <Icon name="bookmark" size="lg" stroke="thin" tone="text" filled={isBookmarked} />
      </Pressable>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
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
    color: c.text,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
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
