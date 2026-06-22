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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UserInline } from "../common/UserInline";
import { createComment, getComments } from "../../features/comments/api";
import type { Comment } from "../../features/comments/types";
import { colors } from "../../lib/theme";

type CommentsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange: (postId: string, nextCount: number) => void;
  onUserPress: (nickname: string) => void;
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
  onUserPress,
  postId,
}: CommentsSheetProps) {
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const flatComments = useMemo(() => flattenComments(comments), [comments]);
  const sheetTranslateY = useRef(new Animated.Value(0)).current;

  const closeWithAnimation = useCallback(() => {
    Animated.timing(sheetTranslateY, {
      duration: 180,
      toValue: 720,
      useNativeDriver: true,
    }).start(() => {
      sheetTranslateY.setValue(0);
      onClose();
    });
  }, [onClose, sheetTranslateY]);

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
        style={[
          styles.overlay,
          {
            paddingBottom: insets.bottom,
            paddingTop: insets.top,
          },
        ]}
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
                  <Text style={styles.emptyDescription}>첫 댓글을 남겨보세요.</Text>
                </View>
              }
              contentContainerStyle={styles.commentList}
              data={flatComments}
              keyExtractor={(comment) => comment.id}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.commentBlock,
                    item.parent_id ? styles.replyRow : null,
                  ]}
                >
                  <UserInline
                    avatarSize={34}
                    imageUrl={item.user.avatar_url}
                    meta={getRelativeTimeLabel(item.created_at)}
                    nickname={item.user.nickname}
                    nicknameSize={13}
                    onPress={onUserPress}
                  />
                  <Text style={styles.commentContent}>{item.content}</Text>
                </View>
              )}
              style={styles.commentListBox}
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
    paddingHorizontal: 18,
    paddingVertical: 12,
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
  commentBlock: {
    paddingVertical: 9,
  },
  replyRow: {
    marginLeft: 34,
  },
  commentContent: {
    marginTop: 4,
    marginLeft: 46,
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
