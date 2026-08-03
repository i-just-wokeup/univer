import { Pressable, StyleSheet, Text, View } from "react-native";

import type { SearchUser } from "../../features/search/api";
import { nicknameTextStyle, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { Avatar } from "../common/Avatar";

type SearchUserRowProps = {
  onPress: (user: SearchUser) => void;
  user: SearchUser;
};

// 순수 UI. 검색 결과 한 행(아바타 + 닉네임 + 학과).
export function SearchUserRow({ onPress, user }: SearchUserRowProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(user)}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <Avatar imageUrl={user.avatar_url} label={user.nickname} size={40} />
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.nickname}>
          {user.nickname}
        </Text>
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
    fontSize: 14,
  },
  department: {
    marginTop: 3,
    color: c.muted,
    fontSize: 12,
    fontWeight: "600",
  },
});
