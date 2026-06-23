import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ConnectionUser } from "../../features/profile/types";
import { colors } from "../../lib/theme";
import { UserInline } from "../common/UserInline";
import type { ConnectionTab } from "./ConnectionTabs";

type ConnectionUserRowProps = {
  isBusy: boolean;
  onAccept: () => void;
  onCancel: () => void;
  onPressUser: (nickname: string) => void;
  onReject: () => void;
  onRemove: () => void;
  tab: ConnectionTab;
  user: ConnectionUser;
};

export function ConnectionUserRow({
  isBusy,
  onAccept,
  onCancel,
  onPressUser,
  onReject,
  onRemove,
  tab,
  user,
}: ConnectionUserRowProps) {
  return (
    <View style={styles.row}>
      <UserInline
        avatarSize={48}
        imageUrl={user.avatar_url}
        meta={user.department ?? undefined}
        nickname={user.nickname}
        onPress={onPressUser}
        style={styles.user}
      />
      <ConnectionActions
        isBusy={isBusy}
        onAccept={onAccept}
        onCancel={onCancel}
        onReject={onReject}
        onRemove={onRemove}
        tab={tab}
      />
    </View>
  );
}

type ConnectionActionsProps = {
  isBusy: boolean;
  onAccept: () => void;
  onCancel: () => void;
  onReject: () => void;
  onRemove: () => void;
  tab: ConnectionTab;
};

function ConnectionActions({
  isBusy,
  onAccept,
  onCancel,
  onReject,
  onRemove,
  tab,
}: ConnectionActionsProps) {
  if (tab === "friends") {
    return (
      <RowButton disabled={isBusy} label="삭제" onPress={onRemove} />
    );
  }

  if (tab === "received") {
    return (
      <View style={styles.actions}>
        <RowButton disabled={isBusy} label="수락" onPress={onAccept} primary />
        <RowButton disabled={isBusy} label="거절" onPress={onReject} />
      </View>
    );
  }

  return <RowButton disabled={isBusy} label="취소" onPress={onCancel} />;
}

type RowButtonProps = {
  disabled: boolean;
  label: string;
  onPress: () => void;
  primary?: boolean;
};

function RowButton({
  disabled,
  label,
  onPress,
  primary = false,
}: RowButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.primaryButton : styles.secondaryButton,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text style={[styles.buttonText, primary ? styles.primaryText : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  user: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 6,
  },
  button: {
    minWidth: 58,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    paddingHorizontal: 12,
  },
  primaryButton: {
    backgroundColor: colors.accent,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  buttonText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
  },
  primaryText: {
    color: colors.white,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
});
