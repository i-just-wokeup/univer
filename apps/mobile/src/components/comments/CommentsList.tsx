import { useCallback } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";

import { CommentThread } from "./CommentThread";
import type { Comment } from "../../features/comments/types";
import { colors } from "../../lib/theme";

type CommentsListProps = {
  comments: Comment[];
  deletingCommentId: string | null;
  expandedReplyIds: Set<string>;
  isLoading: boolean;
  likedCommentIds: Set<string>;
  onLongPress: (comment: Comment) => void;
  onReply: (comment: Comment) => void;
  onToggleLike: (commentId: string) => void;
  onToggleReplies: (commentId: string) => void;
  onUserPress: (nickname: string) => void;
};

// 댓글 목록의 로딩/빈상태/스레드 렌더링만 담당한다.
export function CommentsList({
  comments,
  deletingCommentId,
  expandedReplyIds,
  isLoading,
  likedCommentIds,
  onLongPress,
  onReply,
  onToggleLike,
  onToggleReplies,
  onUserPress,
}: CommentsListProps) {
  const keyExtractor = useCallback((comment: Comment) => comment.id, []);
  const renderItem = useCallback(
    ({ item }: { item: Comment }) => (
      <CommentThread
        comment={item}
        deletingCommentId={deletingCommentId}
        expandedReplyIds={expandedReplyIds}
        likedCommentIds={likedCommentIds}
        onLongPress={onLongPress}
        onReply={onReply}
        onToggleLike={onToggleLike}
        onToggleReplies={onToggleReplies}
        onUserPress={onUserPress}
      />
    ),
    [
      deletingCommentId,
      expandedReplyIds,
      likedCommentIds,
      onLongPress,
      onReply,
      onToggleLike,
      onToggleReplies,
      onUserPress,
    ],
  );

  if (isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingText}>댓글을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <FlatList
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>아직 댓글이 없습니다</Text>
          <Text style={styles.emptyDescription}>첫 댓글을 남겨보세요.</Text>
        </View>
      }
      contentContainerStyle={styles.commentList}
      data={comments}
      initialNumToRender={12}
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="handled"
      maxToRenderPerBatch={8}
      removeClippedSubviews
      renderItem={renderItem}
      style={styles.commentListBox}
      windowSize={7}
    />
  );
}

const styles = StyleSheet.create({
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  commentList: {
    paddingVertical: 8,
  },
  commentListBox: {
    flex: 1,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 42,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  emptyDescription: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
});
