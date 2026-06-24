import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Message } from "../../features/chat/api";
import { colors } from "../../lib/theme";
import { formatChatTime } from "../../lib/utils/time";

type MessageBubbleProps = {
  isMine: boolean;
  message: Message;
};

// 버블을 탭하면 시간(내 메시지는 읽음/전송됨까지)을 보여준다. (웹의 hover와 동일 역할)
export function MessageBubble({ isMine, message }: MessageBubbleProps) {
  const [showMeta, setShowMeta] = useState(false);

  const meta = isMine
    ? `${message.read_at ? "읽음" : "전송됨"} · ${formatChatTime(message.created_at)}`
    : formatChatTime(message.created_at);

  return (
    <View style={[styles.row, isMine ? styles.mineRow : styles.otherRow]}>
      <View style={[styles.contentWrap, isMine ? styles.mineWrap : styles.otherWrap]}>
        <Pressable
          onPress={() => setShowMeta((current) => !current)}
          style={[styles.bubble, isMine ? styles.mineBubble : styles.otherBubble]}
        >
          <Text style={[styles.content, isMine ? styles.mineText : styles.otherText]}>
            {message.content}
          </Text>
        </Pressable>
        {showMeta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    flexDirection: "row",
    paddingVertical: 3,
  },
  mineRow: {
    justifyContent: "flex-end",
  },
  otherRow: {
    justifyContent: "flex-start",
  },
  contentWrap: {
    maxWidth: "78%",
    gap: 3,
  },
  mineWrap: {
    alignItems: "flex-end",
  },
  otherWrap: {
    alignItems: "flex-start",
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  mineBubble: {
    borderTopRightRadius: 5,
    backgroundColor: colors.accent,
  },
  otherBubble: {
    borderTopLeftRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    backgroundColor: colors.white,
  },
  content: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
  },
  mineText: {
    color: colors.white,
  },
  otherText: {
    color: colors.text,
  },
  meta: {
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: "700",
  },
});
