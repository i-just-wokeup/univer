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
export function CommentThread({
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
