import { Pressable, StyleSheet, Text, View, type TextStyle } from "react-native";

import type { ConnectionStatus } from "../../features/profile/types";
import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type ProfileConnectionActionsProps = {
  connectionStatus: ConnectionStatus;
  disabled?: boolean;
  isCrewEligible: boolean;
  onAccept: () => void;
  onMessage?: () => void;
  onReject: () => void;
  onRemove: () => void;
  onSend: () => void;
};

export function ProfileConnectionActions({
  connectionStatus,
  disabled = false,
  isCrewEligible,
  onAccept,
  onMessage,
  onReject,
  onRemove,
  onSend,
}: ProfileConnectionActionsProps) {
  const styles = useThemedStyles(makeStyles);

  if (!isCrewEligible) {
    return onMessage ? (
      <View style={styles.container}>
        <ActionButton
          disabled={disabled}
          label="메시지"
          onPress={onMessage}
          variant="primary"
        />
      </View>
    ) : null;
  }

  if (
    connectionStatus.status === "none" ||
    connectionStatus.status === "rejected"
  ) {
    return (
      <View style={styles.container}>
        <ActionButton
          disabled={disabled}
          label="메시지"
          onPress={onMessage}
          variant="secondary"
        />
        <ActionButton
          disabled={disabled}
          label="친구 신청"
          onPress={onSend}
          variant="primary"
        />
      </View>
    );
  }

  if (connectionStatus.status === "pending" && connectionStatus.is_requester) {
    return (
      <View style={styles.container}>
        <ActionButton
          disabled={disabled}
          label="메시지"
          onPress={onMessage}
          variant="secondary"
        />
        <ActionButton disabled label="요청됨" variant="muted" />
        <ActionButton
          disabled={disabled}
          label="취소"
          onPress={onRemove}
          variant="secondary"
        />
      </View>
    );
  }

  if (connectionStatus.status === "pending") {
    return (
      <View style={styles.container}>
        <ActionButton
          disabled={disabled}
          label="메시지"
          onPress={onMessage}
          variant="secondary"
        />
        <ActionButton
          disabled={disabled}
          label="수락"
          onPress={onAccept}
          variant="primary"
        />
        <ActionButton
          disabled={disabled}
          label="거절"
          onPress={onReject}
          variant="secondary"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActionButton
        disabled={disabled}
        label="메시지"
        onPress={onMessage}
        variant="primary"
      />
      <ActionButton disabled label="친구 ✓" variant="accentSoft" />
    </View>
  );
}

type ActionButtonProps = {
  disabled?: boolean;
  label: string;
  onPress?: () => void;
  variant: "accentSoft" | "muted" | "primary" | "secondary";
};

function ActionButton({
  disabled = false,
  label,
  onPress,
  variant,
}: ActionButtonProps) {
  const styles = useThemedStyles(makeStyles);
  const textStyleByVariant: Record<ActionButtonProps["variant"], TextStyle> = {
    accentSoft: styles.accentSoftText,
    muted: styles.mutedText,
    primary: styles.primaryText,
    secondary: styles.secondaryText,
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text style={[styles.buttonText, textStyleByVariant[variant]]}>
        {label}
      </Text>
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  button: {
    minWidth: 86,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: c.accent,
  },
  secondary: {
    backgroundColor: c.chipFill,
  },
  muted: {
    backgroundColor: c.chipFill,
  },
  accentSoft: {
    backgroundColor: c.accentSoft,
  },
  buttonText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
  },
  primaryText: {
    color: c.onAccent,
  },
  secondaryText: {
    color: c.muted,
  },
  mutedText: {
    color: c.muted,
  },
  accentSoftText: {
    color: c.accent,
  },
  disabled: {
    opacity: 0.95,
  },
  pressed: {
    opacity: 0.7,
  },
});
