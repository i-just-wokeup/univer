import { Pressable, StyleSheet, Text } from "react-native";

import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { Avatar } from "../common/Avatar";

type ProfileEditAvatarProps = {
  avatarUrl: string | null;
  label: string;
  onPress: () => void;
};

export function ProfileEditAvatar({
  avatarUrl,
  label,
  onPress,
}: ProfileEditAvatarProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed ? styles.pressed : null,
      ]}
    >
      <Avatar imageUrl={avatarUrl} label={label || "내"} size={86} />
      <Text style={styles.text}>프로필 사진 변경</Text>
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  text: {
    marginTop: 10,
    color: c.accent,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
  },
  pressed: {
    opacity: 0.72,
  },
});
