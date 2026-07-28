import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import { Avatar } from "./Avatar";
import { colors, nicknameTextStyle } from "../../lib/theme";

type UserInlineProps = {
  avatarSize: number;
  imageUrl: string | null;
  meta?: string;
  nickname: string;
  nicknameSize?: number;
  onPress?: (nickname: string) => void;
  style?: ViewStyle;
};

export function UserInline({
  avatarSize,
  imageUrl,
  meta,
  nickname,
  nicknameSize = 15,
  onPress,
  style,
}: UserInlineProps) {
  return (
    <Pressable
      accessibilityLabel={`${nickname} 프로필 보기`}
      accessibilityRole="button"
      disabled={!onPress}
      onPress={() => onPress?.(nickname)}
      style={({ pressed }) => [
        styles.container,
        style,
        pressed && onPress ? styles.pressed : null,
      ]}
    >
      <Avatar imageUrl={imageUrl} label={nickname} size={avatarSize} />
      <View style={styles.textBox}>
        <Text numberOfLines={1} style={styles.metaLine}>
          <Text style={[styles.nickname, { fontSize: nicknameSize }]}>
            {nickname}
          </Text>
          {meta ? <Text style={styles.metaText}> · {meta}</Text> : null}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pressed: {
    opacity: 0.65,
  },
  textBox: {
    flex: 1,
    minWidth: 0,
  },
  metaLine: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "500",
  },
  nickname: {
    ...nicknameTextStyle,
  },
  metaText: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "500",
  },
});
