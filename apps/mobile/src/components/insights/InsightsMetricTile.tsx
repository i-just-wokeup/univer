import { Pressable, StyleSheet, Text, View } from "react-native";

import type { InsightMetric } from "../../features/metrics/useInsights";
import { fontSize, fontWeight, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type InsightsMetricTileProps = {
  isSelected: boolean;
  metric: InsightMetric;
  onPress: () => void;
};

export function InsightsMetricTile({
  isSelected,
  metric,
  onPress,
}: InsightsMetricTileProps) {
  const styles = useThemedStyles(makeStyles);
  const changePrefix = metric.changePercent > 0 ? "+" : "";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={[styles.tile, isSelected ? styles.tileSelected : null]}
    >
      <Text style={[styles.label, isSelected ? styles.labelSelected : null]}>
        {metric.label}
      </Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.value}>
        {metric.value.toLocaleString("ko-KR")}
      </Text>
      <View style={styles.changeSlot}>
        <Text
          style={[
            styles.change,
            metric.changePercent < 0 ? styles.changeDown : null,
          ]}
        >
          {metric.changePercent === 0
            ? "0%"
            : `${changePrefix}${metric.changePercent}%`}
        </Text>
      </View>
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  tile: {
    minWidth: 0,
    flex: 1,
    minHeight: 112,
    justifyContent: "space-between",
    borderRadius: 16,
    backgroundColor: c.navBackground,
    padding: 14,
  },
  tileSelected: {
    borderWidth: 2,
    borderColor: c.brand,
    backgroundColor: c.card,
    padding: 12,
  },
  label: {
    color: c.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.semibold,
  },
  labelSelected: {
    color: c.brand,
  },
  value: {
    color: c.text,
    fontSize: fontSize.displayMedium,
    fontWeight: fontWeight.heavy,
  },
  changeSlot: {
    minHeight: 15,
  },
  change: {
    color: c.success,
    fontSize: fontSize.footnote,
    fontWeight: fontWeight.bold,
  },
  changeDown: {
    color: c.danger,
  },
});
