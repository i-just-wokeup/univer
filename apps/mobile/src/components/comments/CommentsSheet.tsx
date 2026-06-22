import { Send } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Avatar } from "../common/Avatar";
import { createComment, getComments } from "../../features/comments/api";
import type { Comment } from "../../features/comments/types";
import { colors } from "../../lib/theme";

type CommentsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange: (postId: string, nextCount: number) => void;
  postId: string | null;
};

function flattenComments(comments: Comment[]) {
  return comments.flatMap((comment) => [comment, ...comment.replies]);
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

export function CommentsSheet({
  isOpen,
  onClose,
  onCommentCountChange,
  postId,
}: CommentsSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const flatComments = useMemo(() => flattenComments(comments), [comments]);

  useEffect(() => {
    if (!isOpen || !postId) {
      return;
    }

    let isMounted = true;

    async function loadComments() {
      if (!postId) {
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");
        const loadedComments = await getComments(postId);

        if (!isMounted) {
          return;
        }

        setComments(loadedComments);
        onCommentCountChange(postId, loadedComments.length);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "댓글을 불러오지 못했습니다.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadComments();

    return () => {
      isMounted = false;
    };
  }, [isOpen, onCommentCountChange, postId]);

  async function handleSubmit() {
    if (!postId || isSubmitting || content.trim().length === 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      const nextComment = await createComment(postId, content);
      setComments((currentComments) => {
        const nextComments = [nextComment, ...currentComments];
        onCommentCountChange(postId, nextComments.length);
        return nextComments;
      });
      setContent("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "댓글 작성에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={isOpen && Boolean(postId)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>댓글</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>닫기</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.loadingText}>댓글을 불러오는 중...</Text>
            </View>
          ) : (
            <FlatList
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>아직 댓글이 없습니다</Text>
                  <Text style={styles.emptyDescription}>첫 댓글을 남겨보세요.</Text>
                </View>
              }
              contentContainerStyle={styles.commentList}
              data={flatComments}
              keyExtractor={(comment) => comment.id}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.commentRow,
                    item.parent_id ? styles.replyRow : null,
                  ]}
                >
                  <Avatar
                    imageUrl={item.user.avatar_url}
                    label={item.user.nickname}
                    size={34}
                  />
                  <View style={styles.commentBody}>
                    <Text style={styles.commentMeta}>
                      <Text style={styles.commentNickname}>
                        {item.user.nickname}
                      </Text>
                      <Text style={styles.commentTime}>
                        {" · "}
                        {getRelativeTimeLabel(item.created_at)}
                      </Text>
                    </Text>
                    <Text style={styles.commentContent}>{item.content}</Text>
                  </View>
                </View>
              )}
            />
          )}

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.inputRow}>
            <TextInput
              onChangeText={setContent}
              placeholder="댓글 달기..."
              placeholderTextColor={colors.textFaint}
              style={styles.input}
              value={content}
            />
            <Pressable
              disabled={isSubmitting || content.trim().length === 0}
              onPress={() => {
                void handleSubmit();
              }}
              style={[
                styles.sendButton,
                isSubmitting || content.trim().length === 0
                  ? styles.sendButtonDisabled
                  : null,
              ]}
            >
              <Send color={colors.white} size={18} strokeWidth={2.7} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.24)",
  },
  sheet: {
    maxHeight: "82%",
    minHeight: "58%",
    overflow: "hidden",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.white,
  },
  handle: {
    alignSelf: "center",
    height: 5,
    width: 42,
    marginTop: 10,
    borderRadius: 999,
    backgroundColor: "#D8D4E2",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  closeButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  closeText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  loadingBox: {
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
    paddingHorizontal: 18,
    paddingVertical: 12,
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
  commentRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 9,
  },
  replyRow: {
    marginLeft: 34,
  },
  commentBody: {
    flex: 1,
  },
  commentMeta: {
    color: colors.textFaint,
    fontSize: 13,
    fontWeight: "700",
  },
  commentNickname: {
    color: colors.text,
    fontWeight: "900",
  },
  commentTime: {
    color: colors.textFaint,
    fontWeight: "700",
  },
  commentContent: {
    marginTop: 3,
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    height: 44,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "#F7F5FB",
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 16,
  },
  sendButton: {
    height: 42,
    width: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.accent,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
