import { Heart } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Comment } from "../../features/comments/types";
import { colors } from "../../lib/theme";
import { getRelativeTimeLabel } from "../../lib/utils/time";
import { UserInline } from "../common/UserInline";

type CommentRowProps = {
  comment: Comment;
  isDeleting: boolean;
  isLiked: boolean;
  isOwn: boolean;
  isReply?: boolean;
  mentionNickname?: string;
  onDelete: (commentId: string) => void;
  onReply: (comment: Comment) => void;
  onToggleLike: (commentId: string) => void;
  onUserPress: (nickname: string) => void;
};

// 순수 UI. 댓글 한 행(원댓글/대댓글). 대댓글이면 부모 닉네임 @멘션을 링크로 표시.
export function CommentRow({
  comment,
  isDeleting,
  isLiked,
  isOwn,
  isReply = false,
  mentionNickname,
  onDelete,
  onReply,
  onToggleLike,
  onUserPress,
}: CommentRowProps) {
  const mentionPrefix = isReply && mentionNickname ? `@${mentionNickname}` : "";
  const restContent =
    mentionPrefix && comment.content.startsWith(mentionPrefix)
      ? comment.content.slice(mentionPrefix.length)
      : null;
  const hasMention =
    mentionPrefix.length > 0 &&
    restContent !== null &&
    (restContent.length === 0 || /^\s/.test(restContent));

  return (
    <View style={[styles.row, isReply ? styles.replyRow : null]}>
      <View style={styles.main}>
        <UserInline
          avatarSize={32}
          imageUrl={comment.user.avatar_url}
          meta={getRelativeTimeLabel(comment.created_at)}
          nickname={comment.user.nickname}
          nicknameSize={13}
          onPress={onUserPress}
        />

        {hasMention && mentionNickname ? (
          <Text style={styles.content}>
            <Text
              onPress={() => onUserPress(mentionNickname)}
              style={styles.mention}
            >
              {mentionPrefix}
            </Text>
            {restContent}
          </Text>
        ) : (
          <Text style={styles.content}>{comment.content}</Text>
        )}

        {!isReply ? (
          <Pressable onPress={() => onReply(comment)}>
            <Text style={styles.replyButton}>답글 달기</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.sideActions}>
        <Pressable
          onPress={() => onToggleLike(comment.id)}
          style={styles.likeButton}
        >
          <Heart
            color={isLiked ? colors.danger : colors.textFaint}
            fill={isLiked ? colors.danger : "transparent"}
            size={16}
            strokeWidth={2.4}
          />
          <Text style={[styles.likeCount, isLiked ? styles.likeCountOn : null]}>
            {comment.likes_count}
          </Text>
        </Pressable>

        {isOwn ? (
          <Pressable
            disabled={isDeleting}
            onPress={() => onDelete(comment.id)}
            style={isDeleting ? styles.deleteDisabled : null}
          >
            <Text style={styles.deleteText}>삭제</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  replyRow: {
    marginLeft: 36,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  content: {
    marginTop: 4,
    marginLeft: 44,
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  mention: {
    color: colors.accent,
    fontWeight: "800",
  },
  replyButton: {
    marginTop: 6,
    marginLeft: 44,
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "800",
  },
  sideActions: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingTop: 2,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likeCount: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "800",
  },
  likeCountOn: {
    color: colors.danger,
  },
  deleteText: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "800",
  },
  deleteDisabled: {
    opacity: 0.5,
  },
});
