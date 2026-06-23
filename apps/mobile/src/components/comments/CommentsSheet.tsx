import { Send } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CommentRow } from "./CommentRow";
import {
  createComment,
  deleteComment,
  getComments,
  getCurrentCommentUserId,
  getLikedCommentIds,
  toggleCommentLike,
} from "../../features/comments/api";
import type { Comment } from "../../features/comments/types";
import { colors } from "../../lib/theme";

type CommentsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange: (postId: string, nextCount: number) => void;
  onUserPress: (nickname: string) => void;
  postId: string | null;
};

type ReplyTarget = {
  nickname: string;
  parentId: string;
};

function flattenComments(comments: Comment[]) {
  return comments.flatMap((comment) => [comment, ...comment.replies]);
}

function addReply(comments: Comment[], parentId: string, reply: Comment) {
  return comments.map((comment) =>
    comment.id === parentId
      ? { ...comment, replies: [...comment.replies, reply] }
      : comment,
  );
}

function removeComment(comments: Comment[], commentId: string) {
  return comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: comment.replies.filter((reply) => reply.id !== commentId),
    }));
}

function updateCommentLikes(
  comments: Comment[],
  commentId: string,
  likesCount: number,
) {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      return { ...comment, likes_count: likesCount };
    }

    return {
      ...comment,
      replies: comment.replies.map((reply) =>
        reply.id === commentId ? { ...reply, likes_count: likesCount } : reply,
      ),
    };
  });
}

export function CommentsSheet({
  isOpen,
  onClose,
  onCommentCountChange,
  onUserPress,
  postId,
}: CommentsSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedReplyIds, setExpandedReplyIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );
  const inputRef = useRef<TextInput | null>(null);
  const isClosingRef = useRef(false);
  const sheetTranslateY = useRef(new Animated.Value(0)).current;

  const closeWithAnimation = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    Animated.timing(sheetTranslateY, {
      duration: 180,
      toValue: height,
      useNativeDriver: true,
    }).start(() => {
      isClosingRef.current = false;
      onClose();
    });
  }, [height, onClose, sheetTranslateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          gestureState.dy > 8 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onMoveShouldSetPanResponderCapture: (_event, gestureState) =>
          gestureState.dy > 2 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderGrant: () => {
          sheetTranslateY.stopAnimation();
          sheetTranslateY.setValue(0);
        },
        onPanResponderMove: (_event, gestureState) => {
          sheetTranslateY.setValue(Math.max(0, gestureState.dy));
        },
        onPanResponderRelease: (_event, gestureState) => {
          if (gestureState.dy > 56 || gestureState.vy > 0.75) {
            closeWithAnimation();
            return;
          }
          Animated.spring(sheetTranslateY, {
            damping: 22,
            mass: 0.7,
            stiffness: 240,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(sheetTranslateY, {
            damping: 22,
            mass: 0.7,
            stiffness: 240,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [closeWithAnimation, sheetTranslateY],
  );

  useEffect(() => {
    if (!isOpen || !postId) {
      return;
    }

    sheetTranslateY.setValue(0);
    isClosingRef.current = false;
    setContent("");
    setReplyTarget(null);
    setExpandedReplyIds(new Set());
    setErrorMessage("");
    let isMounted = true;

    async function loadComments() {
      if (!postId) {
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");
        const [loadedComments, loadedUserId] = await Promise.all([
          getComments(postId),
          getCurrentCommentUserId(),
        ]);
        const likedIds = await getLikedCommentIds(
          flattenComments(loadedComments).map((comment) => comment.id),
        );

        if (!isMounted) {
          return;
        }

        setComments(loadedComments);
        setCurrentUserId(loadedUserId);
        setLikedCommentIds(new Set(likedIds));
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
  }, [isOpen, onCommentCountChange, postId, sheetTranslateY]);

  async function handleSubmit() {
    const trimmed = content.trim();

    if (!postId || isSubmitting || trimmed.length === 0) {
      return;
    }

    const parentId = replyTarget?.parentId;

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      const created = await createComment(postId, trimmed, parentId);
      setContent("");
      setReplyTarget(null);

      if (created.parent_id) {
        const replyParentId = created.parent_id;
        setComments((current) => addReply(current, replyParentId, created));
        setExpandedReplyIds((current) => {
          const next = new Set(current);
          next.add(replyParentId);
          return next;
        });
      } else {
        setComments((current) => {
          const next = [created, ...current];
          onCommentCountChange(postId, next.length);
          return next;
        });
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "댓글 작성에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleReply = useCallback((comment: Comment) => {
    setReplyTarget({ nickname: comment.user.nickname, parentId: comment.id });
    setContent(`@${comment.user.nickname} `);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  function handleCancelReply() {
    setReplyTarget(null);
    setContent("");
  }

  const toggleReplies = useCallback((commentId: string) => {
    setExpandedReplyIds((current) => {
      const next = new Set(current);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  }, []);

  const handleToggleLike = useCallback(
    async (commentId: string) => {
      const previousComments = comments;
      const previousLiked = new Set(likedCommentIds);
      const wasLiked = likedCommentIds.has(commentId);

      setErrorMessage("");
      setLikedCommentIds((current) => {
        const next = new Set(current);
        if (wasLiked) {
          next.delete(commentId);
        } else {
          next.add(commentId);
        }
        return next;
      });
      setComments((current) => {
        const target = flattenComments(current).find(
          (comment) => comment.id === commentId,
        );
        const nextCount = Math.max(
          0,
          (target?.likes_count ?? 0) + (wasLiked ? -1 : 1),
        );
        return updateCommentLikes(current, commentId, nextCount);
      });

      try {
        const result = await toggleCommentLike(commentId);
        setLikedCommentIds((current) => {
          const next = new Set(current);
          if (result.liked) {
            next.add(commentId);
          } else {
            next.delete(commentId);
          }
          return next;
        });
        setComments((current) =>
          updateCommentLikes(current, commentId, result.likesCount),
        );
      } catch (error) {
        setComments(previousComments);
        setLikedCommentIds(previousLiked);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "댓글 좋아요 처리에 실패했습니다.",
        );
      }
    },
    [comments, likedCommentIds],
  );

  const handleDelete = useCallback(
    async (commentId: string) => {
      if (!postId) {
        return;
      }

      try {
        setDeletingCommentId(commentId);
        setErrorMessage("");
        await deleteComment(commentId);

        const deletedComment = flattenComments(comments).find(
          (comment) => comment.id === commentId,
        );
        const parentComment = comments.find(
          (comment) => comment.id === commentId,
        );
        const removedIds = parentComment
          ? [commentId, ...parentComment.replies.map((reply) => reply.id)]
          : [commentId];
        const nextComments = removeComment(comments, commentId);

        setComments(nextComments);
        setLikedCommentIds((current) => {
          const next = new Set(current);
          removedIds.forEach((removedId) => next.delete(removedId));
          return next;
        });

        if (deletedComment && deletedComment.parent_id === null) {
          onCommentCountChange(postId, nextComments.length);
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "댓글 삭제에 실패했습니다.",
        );
      } finally {
        setDeletingCommentId(null);
      }
    },
    [comments, onCommentCountChange, postId],
  );

  return (
    <Modal
      animationType="none"
      onRequestClose={onClose}
      transparent
      visible={isOpen && Boolean(postId)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.overlay, { paddingTop: insets.top }]}
      >
        <Pressable onPress={closeWithAnimation} style={styles.backdrop} />
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          <View style={styles.dragArea} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>
          <View style={styles.header} {...panResponder.panHandlers}>
            <Text style={styles.title}>댓글</Text>
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
                  <Text style={styles.emptyDescription}>
                    첫 댓글을 남겨보세요.
                  </Text>
                </View>
              }
              contentContainerStyle={styles.commentList}
              data={comments}
              keyExtractor={(comment) => comment.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <View>
                  <CommentRow
                    comment={item}
                    isDeleting={deletingCommentId === item.id}
                    isLiked={likedCommentIds.has(item.id)}
                    isOwn={currentUserId === item.user.id}
                    onDelete={handleDelete}
                    onReply={handleReply}
                    onToggleLike={handleToggleLike}
                    onUserPress={onUserPress}
                  />
                  {item.replies.length > 0 ? (
                    expandedReplyIds.has(item.id) ? (
                      <View>
                        {item.replies.map((reply) => (
                          <CommentRow
                            comment={reply}
                            isDeleting={deletingCommentId === reply.id}
                            isLiked={likedCommentIds.has(reply.id)}
                            isOwn={currentUserId === reply.user.id}
                            isReply
                            key={reply.id}
                            mentionNickname={item.user.nickname}
                            onDelete={handleDelete}
                            onReply={handleReply}
                            onToggleLike={handleToggleLike}
                            onUserPress={onUserPress}
                          />
                        ))}
                        <Pressable
                          onPress={() => toggleReplies(item.id)}
                          style={styles.replyToggle}
                        >
                          <Text style={styles.replyToggleText}>답글 숨기기</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => toggleReplies(item.id)}
                        style={styles.replyToggle}
                      >
                        <Text style={styles.replyToggleText}>
                          답글 {item.replies.length}개 보기
                        </Text>
                      </Pressable>
                    )
                  ) : null}
                </View>
              )}
              style={styles.commentListBox}
            />
          )}

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(12, insets.bottom + 10) },
            ]}
          >
            {replyTarget ? (
              <View style={styles.replyBanner}>
                <Text style={styles.replyBannerText}>
                  {replyTarget.nickname}에게 답글 달기
                </Text>
                <Pressable onPress={handleCancelReply}>
                  <Text style={styles.replyBannerCancel}>취소</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.inputRow}>
              <TextInput
                onChangeText={setContent}
                placeholder="댓글 달기..."
                placeholderTextColor={colors.textFaint}
                ref={inputRef}
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
        </Animated.View>
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
    height: "94%",
    overflow: "hidden",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.white,
  },
  dragArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 8,
  },
  handle: {
    height: 5,
    width: 42,
    borderRadius: 999,
    backgroundColor: "#D8D4E2",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
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
  replyToggle: {
    marginLeft: 80,
    paddingVertical: 4,
  },
  replyToggleText: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "800",
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  footer: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  replyBannerText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  replyBannerCancel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "900",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
