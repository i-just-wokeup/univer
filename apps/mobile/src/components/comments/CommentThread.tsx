import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CommentRow } from "./CommentRow";
import type { Comment } from "../../features/comments/types";
import { colors } from "../../lib/theme";

type CommentThreadProps = {
  comment: Comment;
  deletingCommentId: string | null;
  expandedReplyIds: Set<string>;
  likedCommentIds: Set<string>;
  onLongPress: (comment: Comment) => void;
  onReply: (comment: Comment) => void;
  onToggleLike: (commentId: string) => void;
  onToggleReplies: (commentId: string) => void;
  onUserPress: (nickname: string) => void;
};

// 원댓글 하나와 그 대댓글 묶음. 답글 펼침/숨김 UI는 여기에서만 관리한다.
function CommentThreadComponent({
  comment,
  deletingCommentId,
  expandedReplyIds,
  likedCommentIds,
  onLongPress,
  onReply,
  onToggleLike,
  onToggleReplies,
  onUserPress,
}: CommentThreadProps) {
  const isExpanded = expandedReplyIds.has(comment.id);

  return (
    <View>
      <CommentRow
        comment={comment}
        isDeleting={deletingCommentId === comment.id}
        isLiked={likedCommentIds.has(comment.id)}
        onLongPress={onLongPress}
        onReply={onReply}
        onToggleLike={onToggleLike}
        onUserPress={onUserPress}
      />
      {comment.replies.length > 0 ? (
        isExpanded ? (
          <View>
            {comment.replies.map((reply) => (
              <CommentRow
                comment={reply}
                isDeleting={deletingCommentId === reply.id}
                isLiked={likedCommentIds.has(reply.id)}
                isReply
                key={reply.id}
                mentionNickname={comment.user.nickname}
                onLongPress={onLongPress}
                onReply={onReply}
                onToggleLike={onToggleLike}
                onUserPress={onUserPress}
              />
            ))}
            <ReplyToggle label="답글 숨기기" onPress={() => onToggleReplies(comment.id)} />
          </View>
        ) : (
          <ReplyToggle
            label={`답글 ${comment.replies.length}개 보기`}
            onPress={() => onToggleReplies(comment.id)}
          />
        )
      ) : null}
    </View>
  );
}

function getThreadDeletingId({
  comment,
  deletingCommentId,
}: Pick<CommentThreadProps, "comment" | "deletingCommentId">) {
  if (!deletingCommentId) {
    return null;
  }

  if (comment.id === deletingCommentId) {
    return deletingCommentId;
  }

  return comment.replies.some((reply) => reply.id === deletingCommentId)
    ? deletingCommentId
    : null;
}

function hasSameLikedState(
  previous: CommentThreadProps,
  next: CommentThreadProps,
) {
  if (
    previous.likedCommentIds.has(previous.comment.id) !==
    next.likedCommentIds.has(next.comment.id)
  ) {
    return false;
  }

  return previous.comment.replies.every(
    (reply) =>
      previous.likedCommentIds.has(reply.id) ===
      next.likedCommentIds.has(reply.id),
  );
}

export const CommentThread = memo(
  CommentThreadComponent,
  (previous, next) =>
    previous.comment === next.comment &&
    getThreadDeletingId(previous) === getThreadDeletingId(next) &&
    previous.expandedReplyIds.has(previous.comment.id) ===
      next.expandedReplyIds.has(next.comment.id) &&
    hasSameLikedState(previous, next) &&
    previous.onLongPress === next.onLongPress &&
    previous.onReply === next.onReply &&
    previous.onToggleLike === next.onToggleLike &&
    previous.onToggleReplies === next.onToggleReplies &&
    previous.onUserPress === next.onUserPress,
);

function ReplyToggle({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.replyToggle}>
      <Text style={styles.replyToggleText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  replyToggle: {
    marginLeft: 80,
    paddingVertical: 4,
  },
  replyToggleText: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "800",
  },
});
