import { Send } from "lucide-react-native";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type LayoutChangeEvent,
} from "react-native";

import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type MessageInputProps = {
  disabled?: boolean;
  inputNativeID?: string;
  onComposerLayout?: (event: LayoutChangeEvent) => void;
  onSend: (content: string) => Promise<void>;
};

export function MessageInput({
  disabled = false,
  inputNativeID,
  onComposerLayout,
  onSend,
}: MessageInputProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [content, setContent] = useState("");
  const trimmedContent = content.trim();
  const canSend = Boolean(trimmedContent) && !disabled;

  function handleSend() {
    if (!canSend) {
      return;
    }

    const nextContent = trimmedContent;
    setContent("");
    void onSend(nextContent).catch(() => undefined);
  }

  return (
    <View onLayout={onComposerLayout} style={styles.container}>
      <TextInput
        editable={!disabled}
        maxLength={1000}
        multiline
        nativeID={inputNativeID}
        onChangeText={setContent}
        placeholder="메시지 입력"
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        value={content}
      />
      <Pressable
        accessibilityLabel="메시지 전송"
        accessibilityRole="button"
        disabled={!canSend}
        onPress={handleSend}
        style={({ pressed }) => [
          styles.sendButton,
          !canSend ? styles.sendButtonDisabled : null,
          pressed && canSend ? styles.pressed : null,
        ]}
      >
        <Send
          color={canSend ? colors.onAccent : colors.textFaint}
          size={19}
          strokeWidth={2.6}
        />
      </Pressable>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.navBackground,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  input: {
    maxHeight: 96,
    minHeight: 38,
    flex: 1,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 18,
    backgroundColor: c.navBackground,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    color: c.text,
    fontSize: 14,
    fontWeight: "700",
  },
  sendButton: {
    height: 38,
    width: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: c.accent,
  },
  sendButtonDisabled: {
    backgroundColor: c.card,
  },
  pressed: {
    opacity: 0.75,
  },
});
