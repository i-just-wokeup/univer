import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { Icon } from "../common/Icon";
import { useTheme, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type SearchInputProps = {
  autoFocus?: boolean;
  onChange: (value: string) => void;
  outlined?: boolean;
  placeholder?: string;
  value: string;
};

export function SearchInput({
  autoFocus = true,
  onChange,
  outlined = true,
  placeholder = "닉네임 검색",
  value,
}: SearchInputProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.wrap, outlined ? styles.outline : null]}>
      <Icon name="search" size="sm" stroke="regular" tone="faint" />
      <TextInput
        autoFocus={autoFocus}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
      {value ? (
        <Pressable
          accessibilityLabel="검색어 지우기"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onChange("")}
          style={styles.clear}
        >
          <Icon name="x" size="sm" stroke="bold" tone="faint" />
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    borderRadius: 18,
    backgroundColor: c.navBackground,
    paddingHorizontal: 16,
  },
  outline: {
    borderWidth: 1,
    borderColor: c.surfaceBorder,
  },
  input: {
    flex: 1,
    color: c.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
  },
  clear: {
    height: 24,
    width: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
});
