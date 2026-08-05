import { Pressable, StyleSheet, Text, View } from "react-native";

import type { SearchUser } from "../../features/search/api";
import { nicknameTextStyle, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { useVerifiedUsers } from "../../lib/verifiedUsers";
import { Avatar } from "../common/Avatar";
import { VerifiedBadge } from "../common/VerifiedBadge";

type SearchUserRowProps = {
  onPress: (user: SearchUser) => void;
  user: SearchUser;
};

// 순수 UI. 검색 결과 한 행(아바타 + 닉네임 + 학과).
export function SearchUserRow({ onPress, user }: SearchUserRowProps) {
  const { isVerified } = useVerifiedUsers();
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(user)}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <Avatar imageUrl={user.avatar_url} label={user.nickname} size={40} />
      <View style={styles.body}>
        <View style={styles.nicknameRow}>
          <Text numberOfLines={1} style={styles.nickname}>
            {user.nickname}
          </Text>
          {isVerified(user.id) ? (
            <View style={styles.verifiedBadge}>
              <VerifiedBadge size={13} />
            </View>
          ) : null}
        </View>
        {user.department ? (
          <Text numberOfLines={1} style={styles.department}>
            {user.department}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pressed: {
    backgroundColor: c.accentSoft,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  nickname: {
    ...nicknameTextStyle,
    color: c.text,
    fontSize: fontSize.bodySmall,
    flexShrink: 1,
  },
  nicknameRow: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  department: {
    marginTop: 3,
    color: c.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
  },
});
