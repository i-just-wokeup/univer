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
import { ActionSheet, type ActionSheetItem } from "../common/ActionSheet";
import { ConfirmDialog } from "../common/ConfirmDialog";
import type { Comment } from "../../features/comments/types";
import { useComments } from "../../features/comments/useComments";
import { colors } from "../../lib/theme";

type CommentsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange: (postId: string, nextCount: number) => void;
  onUserPress: (nickname: string) => void;
  postId: string | null;
};

export function CommentsSheet({
  isOpen,
  onClose,
  onCommentCountChange,
  onUserPress,
  postId,
}: CommentsSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isClosingRef = useRef(false);
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  // 댓글 길게 누르면 뜨는 액션시트 대상(삭제/신고).
  const [menuComment, setMenuComment] = useState<Comment | null>(null);
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const {
    comments,
    content,
    currentUserId,
    deletingCommentId,
    errorMessage,
    expandedReplyIds,
    feedbackMessage,
    handleCancelReply,
    handleDelete,
    handleReply,
    handleReport,
    handleSubmit,
    handleToggleLike,
    inputRef,
    isLoading,
    isSubmitting,
    likedCommentIds,
    replyTarget,
    setContent,
    toggleReplies,
  } = useComments({ isOpen, onCommentCountChange, postId });

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
  }, [isOpen, postId, sheetTranslateY]);

  const commentMenuItems: ActionSheetItem[] = menuComment
    ? [
        currentUserId === menuComment.user.id
          ? {
              danger: true,
              label: "삭제",
              onPress: () => handleDelete(menuComment.id),
            }
          : {
              danger: true,
              label: "신고",
              onPress: () => setReportCommentId(menuComment.id),
            },
        { label: "취소", onPress: () => undefined },
      ]
    : [];

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
                    onLongPress={setMenuComment}
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
                            isReply
                            key={reply.id}
                            mentionNickname={item.user.nickname}
                            onLongPress={setMenuComment}
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

          {feedbackMessage ? (
            <View
              pointerEvents="none"
              style={[styles.feedbackToast, { bottom: insets.bottom + 78 }]}
            >
              <Text style={styles.feedbackToastText}>{feedbackMessage}</Text>
            </View>
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

        <ActionSheet
          isOpen={menuComment !== null}
          items={commentMenuItems}
          onClose={() => setMenuComment(null)}
        />
        <ConfirmDialog
          confirmLabel="신고"
          danger
          description="검토를 위해 이 댓글을 신고합니다."
          isOpen={reportCommentId !== null}
          onCancel={() => setReportCommentId(null)}
          onConfirm={() => {
            const target = reportCommentId;
            setReportCommentId(null);
            if (target) {
              void handleReport(target);
            }
          }}
          title="댓글을 신고할까요?"
        />
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
  // 신고 접수 등 피드백 — 하단 입력창 위에 뜨는 가운데 정렬 토스트 pill.
  feedbackToast: {
    position: "absolute",
    left: 24,
    right: 24,
    alignItems: "center",
  },
  feedbackToastText: {
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: colors.text,
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
    paddingHorizontal: 16,
    paddingVertical: 9,
    textAlign: "center",
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
