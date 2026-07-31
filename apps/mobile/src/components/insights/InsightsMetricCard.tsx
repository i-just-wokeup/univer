import { StyleSheet, Text, View } from "react-native";

import type { InsightMetric } from "../../features/metrics/useInsights";
import { colors } from "../../lib/theme";
import { InsightsTrendChart } from "./InsightsTrendChart";

// 상승만 연두로 강조, 하락은 회색(빨강 안 씀 — 갓 시작/활동 없는 날 알림처럼 안 보이게).
const UP_GREEN = colors.success;

type InsightsMetricCardProps = {
  metric: InsightMetric;
  showChart: boolean;
};

function ChangeBadge({ percent }: { percent: number | null }) {
  if (percent === null || percent === 0) {
    return <Text style={styles.changeFlat}>—</Text>;
  }
  const up = percent > 0;
  return (
    <Text style={[styles.change, { color: up ? UP_GREEN : colors.muted }]}>
      {up ? "+" : "-"}
      {Math.abs(percent)}%
    </Text>
  );
}

export function InsightsMetricCard({
  metric,
  showChart,
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

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
  reach: {
    marginTop: 3,
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "800",
  },
});
