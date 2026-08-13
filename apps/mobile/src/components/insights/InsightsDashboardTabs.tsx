import { Pressable, StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

export type InsightsDashboardTab = "overview" | "content";

const TABS: { label: string; value: InsightsDashboardTab }[] = [
  { label: "개요", value: "overview" },
  { label: "콘텐츠", value: "content" },
];

export function InsightsDashboardTabs({
  onChange,
  value,
}: {
  onChange: (tab: InsightsDashboardTab) => void;
  value: InsightsDashboardTab;
}) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View accessibilityRole="tablist" style={styles.container}>
      {TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={tab.value}
            onPress={() => onChange(tab.value)}
            style={styles.tab}
          >
            <Text style={[styles.label, active ? styles.labelActive : null]}>
              {tab.label}
            </Text>
            <View style={[styles.indicator, active ? styles.indicatorActive : null]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: 48,
  },
  label: {
    color: c.muted,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semibold,
  },
  labelActive: {
    color: c.text,
    fontWeight: fontWeight.heavy,
  },
  indicator: {
    width: "100%",
    height: 3,
    marginTop: 12,
    backgroundColor: "transparent",
  },
  indicatorActive: {
    backgroundColor: c.brand,
  },
});
