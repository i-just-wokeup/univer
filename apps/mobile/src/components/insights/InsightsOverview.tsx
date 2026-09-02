import { StyleSheet, Text, View } from "react-native";

import type {
  InsightMetric,
  InsightMetricKey,
} from "../../features/metrics/useInsights";
import type { ViewsByType } from "../../features/metrics/api";
import { fontSize, fontWeight, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { InsightsMetricTile } from "./InsightsMetricTile";
import { InsightsTrendChart } from "./InsightsTrendChart";
import { InsightsViewsByType } from "./InsightsViewsByType";

type InsightsOverviewProps = {
  metrics: InsightMetric[];
  onSelectMetric: (key: InsightMetricKey) => void;
  selectedMetricKey: InsightMetricKey;
  viewsByType: ViewsByType;
};

export function InsightsOverview({
  metrics,
  onSelectMetric,
  selectedMetricKey,
  viewsByType,
}: InsightsOverviewProps) {
  const styles = useThemedStyles(makeStyles);
  const selectedMetric =
    metrics.find((metric) => metric.key === selectedMetricKey) ?? metrics[0];
  const hasChartData = selectedMetric?.bars.some((bar) => bar.value > 0);

  if (!selectedMetric) {
    return <Text style={styles.empty}>아직 데이터가 없어요</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tiles}>
        {metrics.map((metric) => (
          <InsightsMetricTile
            isSelected={metric.key === selectedMetric.key}
            key={metric.key}
            metric={metric}
            onPress={() => onSelectMetric(metric.key)}
          />
        ))}
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionTitle}>{selectedMetric.label} 추이</Text>
        </View>
        {hasChartData ? (
          <InsightsTrendChart bars={selectedMetric.bars} />
        ) : (
          <Text style={styles.chartEmpty}>아직 데이터가 없어요</Text>
        )}
      </View>

      <InsightsViewsByType values={viewsByType} />
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    gap: 16,
  },
  tiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chartCard: {
    minHeight: 190,
    borderRadius: 18,
    backgroundColor: c.navBackground,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: c.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.heavy,
  },
  chartEmpty: {
    paddingVertical: 58,
    color: c.textFaint,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
  empty: {
    paddingVertical: 48,
    color: c.textFaint,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
});
