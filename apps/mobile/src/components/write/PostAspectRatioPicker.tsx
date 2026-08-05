import { Pressable, StyleSheet, Text, View } from "react-native";

import type { PostAspectRatio } from "../../features/feed/types";
import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

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
  const styles = useThemedStyles(makeStyles);

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

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 4,
    borderRadius: 18,
    backgroundColor: c.surfaceBorder,
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
    backgroundColor: c.accent,
  },
  label: {
    color: c.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.heavy,
    textAlign: "center",
  },
  activeLabel: {
    color: c.onAccent,
  },
  pressed: {
    opacity: 0.72,
  },
});
