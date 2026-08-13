import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

import type { PostRetentionPoint } from "../../features/metrics/api";
import {
  fontSize,
  fontWeight,
  useTheme,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

function formatSeconds(milliseconds: number, percentage: number): string {
  const seconds = Math.round((milliseconds * percentage) / 100_000);
  if (seconds < 60) {
    return `${seconds}초`;
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function PostRetentionChart({
  durationMs,
  points,
}: {
  durationMs: number;
  points: PostRetentionPoint[];
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [width, setWidth] = useState(0);
  const middlePct = points[Math.floor((points.length - 1) / 2)]?.bucketPct ?? 50;
  const data = points.map((point) => ({ value: point.retention }));

  return (
    <View style={styles.container}>
      <View style={styles.chartRow}>
        <View style={styles.yLabels}>
          <Text style={styles.label}>100%</Text>
          <Text style={styles.label}>50%</Text>
          <Text style={styles.label}>0%</Text>
        </View>
        <View
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          style={styles.plot}
        >
          {width > 0 ? (
            <LineChart
              adjustToWidth
              areaChart
              color={colors.brand}
              curved
              curvature={0.15}
              data={data}
              dataPointsColor={colors.brand}
              dataPointsRadius={2}
              disableScroll
              endFillColor={colors.brand}
              endOpacity={0.02}
              endSpacing={4}
              height={132}
              hideAxesAndRules
              initialSpacing={4}
              maxValue={100}
              noOfSections={4}
              startFillColor={colors.brand}
              startOpacity={0.24}
              thickness={2}
              width={width}
              yAxisLabelWidth={0}
            />
          ) : null}
        </View>
      </View>
      <View style={styles.xLabels}>
        <Text style={styles.label}>{formatSeconds(durationMs, 0)}</Text>
        <Text style={styles.label}>{formatSeconds(durationMs, middlePct)}</Text>
        <Text style={styles.label}>{formatSeconds(durationMs, 100)}</Text>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  chartRow: {
    flexDirection: "row",
    gap: 8,
  },
  yLabels: {
    height: 132,
    justifyContent: "space-between",
  },
  plot: {
    minWidth: 0,
    flex: 1,
    height: 132,
    overflow: "hidden",
  },
  xLabels: {
    marginTop: 8,
    marginLeft: 34,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: c.textFaint,
    fontSize: fontSize.tiny,
    fontWeight: fontWeight.regular,
    fontVariant: ["tabular-nums"],
  },
});
