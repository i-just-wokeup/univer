import { ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { InsightPeriod } from "../../features/metrics/useInsights";
import {
  fontSize,
  fontWeight,
  useTheme,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { ActionSheet, type ActionSheetItem } from "../common/ActionSheet";

const OPTIONS: { label: string; value: InsightPeriod }[] = [
  { label: "일간", value: "day" },
  { label: "주간", value: "week" },
  { label: "월간", value: "month" },
];

type InsightsPeriodPickerProps = {
  onChange: (period: InsightPeriod) => void;
  period: InsightPeriod;
};

export function InsightsPeriodPicker({
  onChange,
  period,
}: InsightsPeriodPickerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel =
    OPTIONS.find((option) => option.value === period)?.label ?? "주간";
  const items: ActionSheetItem[] = OPTIONS.map((option) => ({
    label: option.label,
    onPress: () => onChange(option.value),
  }));

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityHint="조회 기간 선택 메뉴를 엽니다"
        accessibilityLabel={`조회 기간 ${selectedLabel}`}
        accessibilityRole="button"
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [
          styles.button,
          pressed ? styles.buttonPressed : null,
        ]}
      >
        <Text style={styles.label}>{selectedLabel}</Text>
        <ChevronDown color={colors.text} size={17} strokeWidth={2.4} />
      </Pressable>

      <ActionSheet
        isOpen={isOpen}
        items={items}
        onClose={() => setIsOpen(false)}
      />
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    alignItems: "flex-start",
  },
  button: {
    minWidth: 104,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    backgroundColor: c.navBackground,
    paddingHorizontal: 14,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  label: {
    color: c.text,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
  },
});
