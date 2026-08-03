import { Pressable, StyleSheet, Text } from "react-native";

import { useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type ProfileEditSaveButtonProps = {
  disabled: boolean;
  isSaving: boolean;
  onPress: () => void;
};

export function ProfileEditSaveButton({
  disabled,
  isSaving,
  onPress,
}: ProfileEditSaveButtonProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text style={styles.text}>{isSaving ? "..." : "저장"}</Text>
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  button: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: c.accent,
    fontSize: 14,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.45,
  },
});
