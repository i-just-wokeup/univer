import { Send } from "lucide-react-native";
import type { RefObject } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type ReplyTarget = {
  nickname: string;
  parentId: string;
};

type CommentInputBarProps = {
  bottomInset: number;
  content: string;
  inputRef: RefObject<TextInput | null>;
  isSubmitting: boolean;
  onCancelReply: () => void;
  onChangeContent: (content: string) => void;
  onSubmit: () => void;
  replyTarget: ReplyTarget | null;
};

// 답글 배너와 댓글 입력창은 항상 같이 움직이므로 한 컴포넌트로 묶는다.
export function CommentInputBar({
  bottomInset,
  content,
  inputRef,
  isSubmitting,
  onCancelReply,
  onChangeContent,
  onSubmit,
  replyTarget,
}: CommentInputBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const canSubmit = !isSubmitting && content.trim().length > 0;

  return (
    <View
      style={[
        styles.footer,
        { paddingBottom: Math.max(12, bottomInset + 10) },
      ]}
    >
      {replyTarget ? (
        <View style={styles.replyBanner}>
          <Text style={styles.replyBannerText}>
            {replyTarget.nickname}에게 답글 달기
          </Text>
          <Pressable onPress={onCancelReply}>
            <Text style={styles.replyBannerCancel}>취소</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          onChangeText={onChangeContent}
          placeholder="댓글 달기..."
          placeholderTextColor={colors.textFaint}
          ref={inputRef}
          style={styles.input}
          value={content}
        />
        <Pressable
          disabled={!canSubmit}
          onPress={onSubmit}
          style={[styles.sendButton, !canSubmit ? styles.sendButtonDisabled : null]}
        >
          <Send color={colors.onAccent} size={18} strokeWidth={2.7} />
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  footer: {
    borderTopColor: c.border,
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
    backgroundColor: c.accentSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  replyBannerText: {
    color: c.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  replyBannerCancel: {
    color: c.accent,
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
    borderColor: c.border,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: c.lavenderTintSoft,
    color: c.text,
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
    backgroundColor: c.accent,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
