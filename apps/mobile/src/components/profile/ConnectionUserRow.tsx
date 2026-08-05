import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ConnectionUser } from "../../features/profile/types";
import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { useVerifiedUsers } from "../../lib/verifiedUsers";
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
  const { getBadge } = useVerifiedUsers();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.row}>
      <UserInline
        avatarSize={48}
        imageUrl={user.avatar_url}
        meta={user.department ?? undefined}
        nickname={user.nickname}
        onPress={onPressUser}
        style={styles.user}
        badge={getBadge(user.id)}
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
  const styles = useThemedStyles(makeStyles);

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
  const styles = useThemedStyles(makeStyles);

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

const makeStyles = (c: ThemeColors) => StyleSheet.create({
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
    backgroundColor: c.accent,
  },
  secondaryButton: {
    backgroundColor: c.navBackground,
  },
  buttonText: {
    color: c.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
  },
  primaryText: {
    color: c.onAccent,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
});
