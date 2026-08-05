import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import { Avatar } from "./Avatar";
import { AccountBadge } from "./AccountBadge";
import type { AccountBadge as AccountBadgeData } from "../../features/verified/api";
import { nicknameTextStyle, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type UserInlineProps = {
  avatarSize: number;
  // 계정 배지(학생회/동아리/승격). variant로 pill 포함(full)/심볼만(symbol) 선택.
  badge?: AccountBadgeData | null;
  badgeVariant?: "full" | "symbol";
  imageUrl: string | null;
  meta?: string;
  nickname: string;
  nicknameSize?: number;
  onPress?: (nickname: string) => void;
  style?: ViewStyle;
};

export function UserInline({
  avatarSize,
  badge,
  badgeVariant = "full",
  imageUrl,
  meta,
  nickname,
  nicknameSize = 15,
  onPress,
  style,
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
          {badge ? (
            <View style={styles.badge}>
              <AccountBadge badge={badge} variant={badgeVariant} />
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
    fontSize: fontSize.label,
    fontWeight: fontWeight.regular,
    flexShrink: 1,
  },
  badge: {
    marginLeft: 5,
  },
});
