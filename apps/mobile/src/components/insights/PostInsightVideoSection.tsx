import { StyleSheet, Text, View } from "react-native";

import type {
  PostInsight,
  PostRetentionPoint,
} from "../../features/metrics/api";
import { fontSize, fontWeight, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { PostRetentionChart } from "./PostRetentionChart";

function formatPercent(value: number | null): string {
  return `${Math.round(value ?? 0)}%`;
}

export function PostInsightVideoSection({
  insight,
  retention,
}: {
  insight: PostInsight;
  retention: PostRetentionPoint[];
}) {
  const styles = useThemedStyles(makeStyles);
  const hasWatchData =
    insight.videoDurationMs !== null && retention.length > 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>영상 시청</Text>
      {hasWatchData ? (
        <>
          <View style={styles.summary}>
            <View style={styles.completionItem}>
              <Text selectable style={styles.completionValue}>
                {formatPercent(insight.completionRate)}
              </Text>
              <Text style={styles.metricLabel}>완주율</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {formatPercent(insight.avgDepth)}
              </Text>
              <Text style={styles.metricLabel}>평균 시청깊이</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {(insight.avgLoops ?? 0).toFixed(1)}회
              </Text>
              <Text style={styles.metricLabel}>평균 반복</Text>
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.chartTitle}>시청 유지율</Text>
          <Text style={styles.chartCaption}>어디서 이탈했나</Text>
          <PostRetentionChart
            durationMs={insight.videoDurationMs ?? 0}
            points={retention}
          />
        </>
      ) : (
        <Text style={styles.empty}>아직 시청 데이터가 없어요</Text>
      )}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: c.navBackground,
    padding: 18,
  },
  title: {
    color: c.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.medium,
  },
  summary: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  completionItem: {
    minWidth: 0,
    flex: 1,
    gap: 4,
  },
  metricItem: {
    minWidth: 0,
    flex: 1,
    gap: 4,
  },
  completionValue: {
    color: c.brand,
    fontSize: fontSize.displaySmall,
    fontWeight: fontWeight.heavy,
    fontVariant: ["tabular-nums"],
  },
  metricValue: {
    color: c.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.medium,
    fontVariant: ["tabular-nums"],
  },
  metricLabel: {
    color: c.textFaint,
    fontSize: fontSize.footnote,
    fontWeight: fontWeight.regular,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 18,
    backgroundColor: c.border,
  },
  chartTitle: {
    color: c.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
  },
  chartCaption: {
    marginTop: 3,
    marginBottom: 14,
    color: c.textFaint,
    fontSize: fontSize.footnote,
    fontWeight: fontWeight.regular,
  },
  empty: {
    paddingVertical: 42,
    color: c.textFaint,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.regular,
    textAlign: "center",
  },
});
