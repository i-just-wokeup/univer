import { StyleSheet, Text, View } from "react-native";

import type { ViewsByType } from "../../features/metrics/api";
import { fontSize, fontWeight, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

const TYPE_ROWS: { key: keyof ViewsByType; label: string }[] = [
  { key: "reel", label: "릴스 조회" },
  { key: "post", label: "게시물 조회" },
  { key: "story", label: "스토리 조회" },
];

export function InsightsViewsByType({ values }: { values: ViewsByType }) {
  const styles = useThemedStyles(makeStyles);
  const maxValue = Math.max(1, ...TYPE_ROWS.map((row) => values[row.key]));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>콘텐츠 유형별 조회</Text>
      <View style={styles.rows}>
        {TYPE_ROWS.map((row) => {
          const value = values[row.key];
          return (
            <View key={row.key} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={styles.label}>{row.label}</Text>
                <Text style={styles.value}>{value.toLocaleString("ko-KR")}</Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${(value / maxValue) * 100}%` },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: c.navBackground,
    padding: 16,
  },
  title: {
    color: c.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.heavy,
  },
  rows: {
    marginTop: 18,
    gap: 16,
  },
  row: {
    gap: 7,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: c.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
  },
  value: {
    color: c.text,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
  },
  track: {
    height: 8,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: c.overlayInk,
  },
  fill: {
    minWidth: 0,
    height: "100%",
    borderRadius: 4,
    backgroundColor: c.brand,
  },
});
