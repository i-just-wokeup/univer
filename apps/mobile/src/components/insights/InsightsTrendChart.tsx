import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

import type { InsightBar } from "../../features/metrics/useInsights";
import { useTheme, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

// YYYY-MM-DD → "M/D"
function shortDay(day: string): string {
  const [, month, date] = day.split("-");
  return `${Number(month)}/${Number(date)}`;
}

// 일별 추이 라인(영역) 차트. gifted-charts는 명시 width가 필요해 onLayout으로 폭을 잰다.
// 날짜 라벨은 내장 x축(점 간격만큼 좁아 잘림) 대신 아래에 직접 3개(처음/중간/끝)를 깐다.
export function InsightsTrendChart({ bars }: { bars: InsightBar[] }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [width, setWidth] = useState(0);
  const n = bars.length;
  const mid = Math.floor((n - 1) / 2);
  const data = bars.map((bar) => ({ value: bar.value }));
  // 뾰족한 끝이 위로 잘리지 않게 최댓값 위 여유를 크게 준다.
  const maxValue = Math.max(1, ...bars.map((bar) => bar.value)) * 1.5;

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={styles.wrap}
    >
      {width > 0 ? (
        <>
          <LineChart
            adjustToWidth
            areaChart
            color={colors.brand}
            curved
            curvature={0.15}
            data={data}
            disableScroll
            endFillColor={colors.brand}
            endOpacity={0.02}
            endSpacing={4}
            height={56}
            hideAxesAndRules
            dataPointsColor={colors.brand}
            dataPointsRadius={2.5}
            initialSpacing={4}
            maxValue={maxValue}
            startFillColor={colors.brand}
            startOpacity={0.22}
            thickness={2}
            width={width}
            yAxisLabelWidth={0}
          />

          <View style={styles.labels}>
            <Text style={styles.label}>{shortDay(bars[0].day)}</Text>
            <Text style={styles.label}>{shortDay(bars[mid].day)}</Text>
            <Text style={styles.label}>{shortDay(bars[n - 1].day)}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  wrap: {
    marginTop: 16,
    overflow: "hidden",
  },
  labels: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: c.textFaint,
    fontSize: fontSize.tiny,
    fontWeight: fontWeight.semibold,
  },
});
