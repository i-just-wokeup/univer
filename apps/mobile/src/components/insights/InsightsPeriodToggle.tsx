import { Pressable, StyleSheet, Text, View } from "react-native";

import type { InsightPeriod } from "../../features/metrics/useInsights";
import { colors } from "../../lib/theme";

const OPTIONS: { value: InsightPeriod; label: string }[] = [
  { value: "day", label: "일간" },
  { value: "week", label: "주간" },
  { value: "month", label: "월간" },
];

type InsightsPeriodToggleProps = {
  period: InsightPeriod;
  onChange: (period: InsightPeriod) => void;
};

export function InsightsPeriodToggle({
  period,
  onChange,
}: InsightsPeriodToggleProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const active = option.value === period;
        return (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.tab, active ? styles.tabActive : null]}
          >
            <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>
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
    padding: 4,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: colors.white,
  },
  tabText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
  },
  tabTextActive: {
    color: colors.accent,
    fontWeight: "900",
  },
});
