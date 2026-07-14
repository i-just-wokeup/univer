import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { InsightBar } from "../../features/metrics/useInsights";
import { colors } from "../../lib/theme";

const CHART_HEIGHT = 46;

function formatDay(day: string): string {
  const [, month, date] = day.split("-");
  return `${Number(month)}월 ${Number(date)}일`;
}

// 순수 View 일별 막대. 각 카드가 자기 최댓값 기준으로 정규화(지표 간 자릿수 달라도 각자 꽉 참).
export function InsightsDailyBars({ bars }: { bars: InsightBar[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const max = Math.max(1, ...bars.map((bar) => bar.value));

  return (
    <View style={styles.wrap}>
      <View style={styles.caption}>
        {selected !== null ? (
          <Text style={styles.captionText}>
            {formatDay(bars[selected].day)} ·{" "}
            {bars[selected].value.toLocaleString("ko-KR")}
          </Text>
        ) : null}
      </View>
      <View style={styles.chart}>
        {bars.map((bar, index) => {
          const active = selected === index;
          const height =
            bar.value === 0 ? 3 : Math.max(5, (bar.value / max) * CHART_HEIGHT);
          return (
            <Pressable
              accessibilityRole="button"
              key={bar.day}
              onPress={() => setSelected(active ? null : index)}
              style={styles.slot}
            >
              <View
                style={[
                  styles.bar,
                  { height },
                  bar.value === 0 ? styles.barEmpty : null,
                  active ? styles.barActive : null,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
  },
  caption: {
    height: 16,
    justifyContent: "center",
  },
  captionText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: CHART_HEIGHT,
    gap: 3,
  },
  slot: {
    flex: 1,
    height: CHART_HEIGHT,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: "72%",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: colors.accent,
  },
  barEmpty: {
    backgroundColor: colors.border,
    borderRadius: 3,
  },
  barActive: {
    backgroundColor: colors.text,
  },
});
