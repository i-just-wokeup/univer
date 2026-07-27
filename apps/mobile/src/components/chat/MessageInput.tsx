import { Send } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { colors } from "../../lib/theme";

type MessageInputProps = {
  disabled?: boolean;
  onSend: (content: string) => Promise<void>;
};

export function MessageInput({ disabled = false, onSend }: MessageInputProps) {
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
    <View style={styles.container}>
      <TextInput
        editable={!disabled}
        maxLength={1000}
        multiline
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
          color={canSend ? colors.white : colors.textFaint}
          size={19}
          strokeWidth={2.6}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  input: {
    maxHeight: 96,
    minHeight: 38,
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    borderRadius: 18,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  sendButton: {
    height: 38,
    width: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.accent,
  },
  sendButtonDisabled: {
    backgroundColor: colors.card,
  },
  pressed: {
    opacity: 0.75,
  },
});
