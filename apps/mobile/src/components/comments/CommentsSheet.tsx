import { useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CommentActionMenus } from "./CommentActionMenus";
import { CommentInputBar } from "./CommentInputBar";
import { CommentsList } from "./CommentsList";
import { CommentsSheetHeader } from "./CommentsSheetHeader";
import { useCommentsSheetDrag } from "./useCommentsSheetDrag";
import type { Comment } from "../../features/comments/types";
import { useComments } from "../../features/comments/useComments";
import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

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
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  // 댓글 길게 누르면 뜨는 액션시트 대상(삭제/신고).
  const [menuComment, setMenuComment] = useState<Comment | null>(null);
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
  const { closeWithAnimation, panHandlers, sheetTranslateY } =
    useCommentsSheetDrag({ height, isOpen, onClose, postId });

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
          <CommentsSheetHeader panHandlers={panHandlers} />

          <CommentsList
            comments={comments}
            deletingCommentId={deletingCommentId}
            expandedReplyIds={expandedReplyIds}
            isLoading={isLoading}
            likedCommentIds={likedCommentIds}
            onLongPress={setMenuComment}
            onReply={handleReply}
            onToggleLike={handleToggleLike}
            onToggleReplies={toggleReplies}
            onUserPress={onUserPress}
          />

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

          <CommentInputBar
            bottomInset={insets.bottom}
            content={content}
            inputRef={inputRef}
            isSubmitting={isSubmitting}
            onCancelReply={handleCancelReply}
            onChangeContent={setContent}
            onSubmit={() => {
              void handleSubmit();
            }}
            replyTarget={replyTarget}
          />
        </Animated.View>

        <CommentActionMenus
          currentUserId={currentUserId}
          menuComment={menuComment}
          onCloseMenu={() => setMenuComment(null)}
          onCloseReport={() => setReportCommentId(null)}
          onConfirmReport={(commentId) => {
            setReportCommentId(null);
            void handleReport(commentId);
          }}
          onDelete={(commentId) => {
            void handleDelete(commentId);
          }}
          onOpenReport={setReportCommentId}
          reportCommentId={reportCommentId}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: c.scrimWeak,
  },
  sheet: {
    height: "94%",
    overflow: "hidden",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: c.navBackground,
  },
  errorText: {
    color: c.danger,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
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
    backgroundColor: c.text,
    color: c.onAccent,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    paddingHorizontal: 16,
    paddingVertical: 9,
    textAlign: "center",
  },
});
