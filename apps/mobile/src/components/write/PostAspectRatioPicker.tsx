import { Pressable, StyleSheet, Text, View } from "react-native";

import type { PostAspectRatio } from "../../features/feed/types";
import { colors } from "../../lib/theme";

const OPTIONS: Array<{ label: string; value: PostAspectRatio }> = [
  { label: "정사각 1:1", value: "square" },
  { label: "세로 4:5", value: "portrait" },
  { label: "가로 16:9", value: "landscape" },
];

type PostAspectRatioPickerProps = {
  onChange: (value: PostAspectRatio) => void;
  value: PostAspectRatio;
};

export function PostAspectRatioPicker({
  onChange,
  value,
}: PostAspectRatioPickerProps) {
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
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    paddingHorizontal: 4,
  },
  activeOption: {
    backgroundColor: colors.accent,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  activeLabel: {
    color: colors.white,
  },
  pressed: {
    opacity: 0.72,
  },
});
