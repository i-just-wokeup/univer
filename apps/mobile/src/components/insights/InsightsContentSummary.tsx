import { StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type ContentTotals = {
  comments: number;
  likes: number;
  saves: number;
  shares: number;
  total: number;
  views: number;
};

const ITEMS: { key: keyof Omit<ContentTotals, "total">; label: string }[] = [
  { key: "likes", label: "좋아요" },
  { key: "comments", label: "댓글" },
  { key: "saves", label: "저장" },
  { key: "shares", label: "공유" },
];

export function InsightsContentSummary({ totals }: { totals: ContentTotals }) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>전체 누적</Text>
      <View style={styles.headline}>
        <View style={styles.headlineItem}>
          <Text style={styles.total}>{totals.views.toLocaleString("ko-KR")}</Text>
          <Text style={styles.totalLabel}>조회</Text>
        </View>
        <View style={styles.headlineItem}>
          <Text style={styles.total}>{totals.total.toLocaleString("ko-KR")}</Text>
          <Text style={styles.totalLabel}>상호작용</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.items}>
        {ITEMS.map((item) => (
          <View key={item.key} style={styles.item}>
            <Text style={styles.itemValue}>
              {totals[item.key].toLocaleString("ko-KR")}
            </Text>
            <Text style={styles.itemLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: c.navBackground,
    padding: 18,
  },
  eyebrow: {
    color: c.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.semibold,
  },
  total: {
    color: c.text,
    fontSize: fontSize.display,
    fontWeight: fontWeight.heavy,
  },
  totalLabel: {
    marginTop: 2,
    color: c.brand,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
  },
  headline: {
    marginTop: 12,
    flexDirection: "row",
    gap: 28,
  },
  headlineItem: {
    minWidth: 0,
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 18,
    backgroundColor: c.border,
  },
  items: {
    flexDirection: "row",
  },
  item: {
    flex: 1,
    alignItems: "center",
  },
  itemValue: {
    color: c.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.heavy,
  },
  itemLabel: {
    marginTop: 4,
    color: c.textFaint,
    fontSize: fontSize.footnote,
    fontWeight: fontWeight.semibold,
  },
});
