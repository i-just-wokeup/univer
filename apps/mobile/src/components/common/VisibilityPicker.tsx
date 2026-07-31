import { Pressable, StyleSheet, Text, View } from "react-native";

import type { PostVisibility } from "../../features/feed/types";
import { colors } from "../../lib/theme";

const OPTIONS: Array<{ label: string; value: PostVisibility }> = [
  { label: "전체공개", value: "public" },
  { label: "크루공개", value: "close_friends" },
];

type VisibilityPickerProps = {
  onChange: (value: PostVisibility) => void;
  value: PostVisibility;
};

export function VisibilityPicker({ onChange, value }: VisibilityPickerProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const isActive = option.value === value;

        return (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              isActive ? styles.activeOption : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={[styles.label, isActive ? styles.activeLabel : null]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 4,
    borderRadius: 18,
    backgroundColor: colors.surfaceBorder,
    padding: 4,
  },
  option: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
  },
  activeOption: {
    backgroundColor: colors.accent,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
  },
  activeLabel: {
    color: colors.white,
  },
  pressed: {
    opacity: 0.72,
  },
});
