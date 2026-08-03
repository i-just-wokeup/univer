import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type ChatRequestBannerProps = {
  isAccepting: boolean;
  isIncomingRequest: boolean;
  onAccept: () => void;
};

export function ChatRequestBanner({
  isAccepting,
  isIncomingRequest,
  onAccept,
}: ChatRequestBannerProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.pendingBox}>
      <Text style={styles.pendingText}>
        메시지 요청 대기 중입니다. 상대방이 수락하면 대화가 시작됩니다.
      </Text>
      {isIncomingRequest ? (
        <Pressable
          disabled={isAccepting}
          onPress={onAccept}
          style={({ pressed }) => [
            styles.acceptButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.acceptText}>
            {isAccepting ? "수락 중..." : "수락하기"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  pendingBox: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: c.accentBorderSoft,
    backgroundColor: c.accentSoft,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pendingText: {
    color: c.accent,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  acceptButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: 13,
    backgroundColor: c.accent,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  acceptText: {
    color: c.onAccent,
    fontSize: 13,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.75,
  },
});
