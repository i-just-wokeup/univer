import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../lib/theme";

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

const styles = StyleSheet.create({
  pendingBox: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.accentBorderSoft,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pendingText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  acceptButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: 13,
    backgroundColor: colors.accent,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  acceptText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.75,
  },
});
