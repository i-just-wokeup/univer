import { Search, X } from "lucide-react-native";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { colors } from "../../lib/theme";

type SearchInputProps = {
  autoFocus?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

export function SearchInput({
  autoFocus = true,
  onChange,
  placeholder = "닉네임, 해시태그 검색",
  value,
}: SearchInputProps) {
  return (
    <View style={styles.wrap}>
      <Search color={colors.textFaint} size={18} strokeWidth={2.4} />
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
          <X color={colors.textFaint} size={16} strokeWidth={2.8} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    backgroundColor: colors.white,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  clear: {
    height: 24,
    width: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
});
