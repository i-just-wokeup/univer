import { StyleSheet, Text, View } from "react-native";

import type { InsightMetric } from "../../features/metrics/useInsights";
import { colors } from "../../lib/theme";
import { InsightsDailyBars } from "./InsightsDailyBars";

// 상승은 초록. 테마엔 없어서 카드 로컬 상수로 둔다.
const POSITIVE = "#12B76A";

type InsightsMetricCardProps = {
  metric: InsightMetric;
  showBars: boolean;
};

function ChangeBadge({ percent }: { percent: number | null }) {
  if (percent === null || percent === 0) {
    return <Text style={styles.changeFlat}>—</Text>;
  }
  const up = percent > 0;
  return (
    <Text style={[styles.change, { color: up ? POSITIVE : colors.danger }]}>
      {up ? "▲" : "▼"} {Math.abs(percent)}%
    </Text>
  );
}

export function InsightsMetricCard({
  metric,
  showBars,
}: InsightsMetricCardProps) {
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
        </View>
      </View>
      {showBars ? <InsightsDailyBars bars={metric.bars} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 22,
    backgroundColor: colors.card,
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
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  hint: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  valueCol: {
    alignItems: "flex-end",
  },
  value: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  change: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "900",
  },
  changeFlat: {
    marginTop: 2,
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "900",
  },
});
