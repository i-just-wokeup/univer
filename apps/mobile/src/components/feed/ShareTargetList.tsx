import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { PostShareTarget } from "../../features/chat/usePostShare";
import { useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { UserInline } from "../common/UserInline";

type ShareTargetListProps = {
  externalShareUrl?: string | null;
  insetsBottom: number;
  onSelectTarget: (target: PostShareTarget) => void;
  sendingTargetId: string | null;
  targets: PostShareTarget[];
};

function getSourceLabel(source: PostShareTarget["source"]) {
  if (source === "conversation") {
    return "대화";
  }

  if (source === "crew") {
    return "크루";
  }

  return "검색";
}

export function ShareTargetList({
  externalShareUrl = null,
  insetsBottom,
  onSelectTarget,
  sendingTargetId,
  targets,
}: ShareTargetListProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.targetList,
        {
          paddingBottom: insetsBottom + (externalShareUrl ? 10 : 16),
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {targets.map((target) => {
        const isSending = sendingTargetId === target.id;

        return (
          <View key={target.id} style={styles.targetRow}>
            <UserInline
              avatarSize={44}
              imageUrl={target.avatar_url}
              meta={target.department ?? getSourceLabel(target.source)}
              nickname={target.nickname}
              style={styles.targetUser}
            />
            <Pressable
              accessibilityRole="button"
              disabled={Boolean(sendingTargetId)}
              onPress={() => onSelectTarget(target)}
              style={({ pressed }) => [
                styles.sendButton,
                pressed && !sendingTargetId ? styles.pressed : null,
                sendingTargetId ? styles.disabled : null,
              ]}
            >
              <Text style={styles.sendText}>
                {isSending ? "전송 중" : "보내기"}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  targetList: {
    paddingHorizontal: 10,
  },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  targetUser: {
    flex: 1,
  },
  sendButton: {
    borderRadius: 999,
    backgroundColor: c.accent,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  sendText: {
    color: c.onAccent,
    fontSize: 13,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
});
