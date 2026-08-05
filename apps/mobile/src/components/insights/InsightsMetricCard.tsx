import { StyleSheet, Text, View } from "react-native";

import type { InsightMetric } from "../../features/metrics/useInsights";
import { useTheme, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { InsightsTrendChart } from "./InsightsTrendChart";

type InsightsMetricCardProps = {
  metric: InsightMetric;
  showChart: boolean;
};

function ChangeBadge({ percent }: { percent: number | null }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (percent === null || percent === 0) {
    return <Text style={styles.changeFlat}>—</Text>;
  }
  const up = percent > 0;
  return (
    <Text style={[styles.change, { color: up ? colors.success : colors.muted }]}>
      {up ? "+" : "-"}
      {Math.abs(percent)}%
    </Text>
  );
}

export function InsightsMetricCard({
  metric,
  showChart,
}: InsightsMetricCardProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.textCol}>
          <Text style={styles.label}>{metric.label}</Text>
          <Text style={styles.hint}>{metric.hint}</Text>
        </View>
        <View style={styles.valueCol}>
          <Text style={styles.value}>
            {metric.value.toLocaleString("ko-KR")}
          </Text>
          <ChangeBadge percent={metric.changePercent} />
          {metric.reachLabel ? (
            <Text style={styles.reach}>
              {metric.reachLabel} {metric.reach.toLocaleString("ko-KR")}
            </Text>
          ) : null}
        </View>
      </View>
      {showChart ? <InsightsTrendChart bars={metric.bars} /> : null}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    borderRadius: 22,
    backgroundColor: c.card,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  textCol: {
    flex: 1,
  },
  label: {
    color: c.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.heavy,
  },
  hint: {
    marginTop: 3,
    color: c.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
  },
  valueCol: {
    alignItems: "flex-end",
  },
  value: {
    color: c.text,
    fontSize: fontSize.displayMedium,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.5,
  },
  change: {
    marginTop: 2,
    fontSize: fontSize.label,
    fontWeight: fontWeight.heavy,
  },
  changeFlat: {
    marginTop: 2,
    color: c.textFaint,
    fontSize: fontSize.label,
    fontWeight: fontWeight.heavy,
  },
  reach: {
    marginTop: 3,
    color: c.textFaint,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
  },
});
