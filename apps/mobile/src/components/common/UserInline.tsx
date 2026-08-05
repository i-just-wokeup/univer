import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import { Avatar } from "./Avatar";
import { AccountBadge } from "./AccountBadge";
import { VerifiedBadge } from "./VerifiedBadge";
import type { AccountBadge as AccountBadgeData } from "../../features/verified/api";
import { nicknameTextStyle, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type UserInlineProps = {
  avatarSize: number;
  // badge를 주면 새 계정 배지(학생회/동아리/승격)를 표시. variant로 pill 포함/심볼만 선택.
  badge?: AccountBadgeData | null;
  badgeVariant?: "full" | "symbol";
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
  badge,
  badgeVariant = "full",
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
          {badge ? (
            <View style={styles.verifiedBadge}>
              <AccountBadge badge={badge} variant={badgeVariant} />
            </View>
          ) : verified ? (
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
    fontSize: fontSize.label,
    fontWeight: fontWeight.regular,
    flexShrink: 1,
  },
  verifiedBadge: {
    marginLeft: 5,
  },
});
