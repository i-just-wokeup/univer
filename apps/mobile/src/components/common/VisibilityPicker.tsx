import { Pressable, StyleSheet, Text, View } from "react-native";

import type { PostVisibility } from "../../features/feed/types";
import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

const OPTIONS: Array<{ label: string; value: PostVisibility }> = [
  { label: "전체공개", value: "public" },
  { label: "크루공개", value: "close_friends" },
];

type VisibilityPickerProps = {
  onChange: (value: PostVisibility) => void;
  value: PostVisibility;
};

export function VisibilityPicker({ onChange, value }: VisibilityPickerProps) {
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
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
  },
  activeOption: {
    backgroundColor: c.accent,
  },
  label: {
    color: c.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
  },
  activeLabel: {
    color: c.onAccent,
  },
  pressed: {
    opacity: 0.72,
  },
});
