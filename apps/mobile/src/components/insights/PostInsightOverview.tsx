import { StyleSheet, Text, View } from "react-native";

import type { PostInsight } from "../../features/metrics/api";
import { fontSize, fontWeight, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

const INTERACTIONS: { key: "likes" | "comments" | "saves" | "shares"; label: string }[] = [
  { key: "likes", label: "좋아요" },
  { key: "comments", label: "댓글" },
  { key: "saves", label: "저장" },
  { key: "shares", label: "공유" },
];

export function PostInsightOverview({ insight }: { insight: PostInsight }) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.card}>
      <View style={styles.primaryMetrics}>
        <PrimaryMetric label="조회" value={insight.views} />
        <View style={styles.primaryDivider} />
        <PrimaryMetric label="도달" value={insight.reach} />
      </View>

      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>상호작용</Text>
      <View style={styles.interactions}>
        {INTERACTIONS.map((item) => (
          <View key={item.key} style={styles.interactionItem}>
            <Text style={styles.interactionValue}>
              {insight[item.key].toLocaleString("ko-KR")}
            </Text>
            <Text style={styles.interactionLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PrimaryMetric({ label, value }: { label: string; value: number }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.primaryMetric}>
      <Text selectable style={styles.primaryValue}>
        {value.toLocaleString("ko-KR")}
      </Text>
      <Text style={styles.primaryLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: c.navBackground,
    padding: 18,
  },
  primaryMetrics: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  primaryMetric: {
    minWidth: 0,
    flex: 1,
    gap: 4,
  },
  primaryValue: {
    color: c.text,
    fontSize: fontSize.display,
    fontWeight: fontWeight.heavy,
    fontVariant: ["tabular-nums"],
  },
  primaryLabel: {
    color: c.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },
  primaryDivider: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: 18,
    backgroundColor: c.border,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 18,
    backgroundColor: c.border,
  },
  sectionTitle: {
    marginBottom: 14,
    color: c.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
  },
  interactions: {
    flexDirection: "row",
  },
  interactionItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  interactionValue: {
    color: c.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.medium,
    fontVariant: ["tabular-nums"],
  },
  interactionLabel: {
    color: c.textFaint,
    fontSize: fontSize.footnote,
    fontWeight: fontWeight.regular,
  },
});
