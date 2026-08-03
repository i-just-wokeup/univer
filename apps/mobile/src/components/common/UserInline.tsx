import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import { Avatar } from "./Avatar";
import { VerifiedBadge } from "./VerifiedBadge";
import { nicknameTextStyle, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type UserInlineProps = {
  avatarSize: number;
  imageUrl: string | null;
  meta?: string;
  nickname: string;
  nicknameSize?: number;
  onPress?: (nickname: string) => void;
  style?: ViewStyle;
  verified?: boolean;
};

export function UserInline({
  avatarSize,
  imageUrl,
  meta,
  nickname,
  nicknameSize = 15,
  onPress,
  style,
  verified = false,
}: UserInlineProps) {
  const styles = useThemedStyles(makeStyles);

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
        <View style={styles.metaLine}>
          <Text
            numberOfLines={1}
            style={[styles.nickname, { fontSize: nicknameSize }]}
          >
            {nickname}
          </Text>
          {verified ? (
            <View style={styles.verifiedBadge}>
              <VerifiedBadge size={13} />
            </View>
          ) : null}
          {meta ? (
            <Text numberOfLines={1} style={styles.metaText}>
              {` · ${meta}`}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
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
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  nickname: {
    ...nicknameTextStyle,
    color: c.text,
    flexShrink: 1,
  },
  metaText: {
    color: c.textFaint,
    fontSize: 12,
    fontWeight: "500",
    flexShrink: 1,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
});
