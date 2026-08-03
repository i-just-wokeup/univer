import { Star } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ActivityFavoriteUser } from "../../features/activity/api";
import { nicknameTextStyle, useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { Avatar } from "../common/Avatar";

type ActivityFavoriteUserRowProps = {
  onPress: (nickname: string) => void;
  user: ActivityFavoriteUser;
};

function formatFavoriteTime(createdAt: string) {
  const date = new Date(createdAt);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

export function ActivityFavoriteUserRow({
  onPress,
  user,
}: ActivityFavoriteUserRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(user.nickname)}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <Avatar imageUrl={user.avatar_url} label={user.nickname} size={46} />
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={styles.nickname}>
            {user.nickname}
          </Text>
          <Star
            color={colors.star}
            fill={colors.star}
            size={15}
            strokeWidth={2.4}
          />
        </View>
        {user.department ? (
          <Text numberOfLines={1} style={styles.department}>
            {user.department}
          </Text>
        ) : null}
      </View>
      <Text style={styles.time}>{formatFavoriteTime(user.favorited_at)}</Text>
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
  pressed: {
    backgroundColor: c.accentSoft,
  },
  body: {
    minWidth: 0,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  nickname: {
    ...nicknameTextStyle,
    color: c.text,
    fontSize: 15,
  },
  department: {
    marginTop: 3,
    color: c.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  time: {
    color: c.textFaint,
    fontSize: 12,
    fontWeight: "800",
  },
});
