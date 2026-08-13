import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ContentPerformance } from "../../features/metrics/api";
import type { ContentPerformanceSort } from "../../features/metrics/useContentPerformance";
import { fontSize, fontWeight, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { InsightsContentRow } from "./InsightsContentRow";
import { InsightsContentSummary } from "./InsightsContentSummary";

type ContentTotals = {
  comments: number;
  likes: number;
  saves: number;
  shares: number;
  total: number;
  views: number;
};

export function InsightsContentTab({
  items,
  onOpenPost,
  onSortChange,
  sort,
  totals,
}: {
  items: ContentPerformance[];
  onOpenPost: (postId: string) => void;
  onSortChange: (sort: ContentPerformanceSort) => void;
  sort: ContentPerformanceSort;
  totals: ContentTotals;
}) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.container}>
      <InsightsContentSummary totals={totals} />

      <View style={styles.listCard}>
        <View style={styles.header}>
          <Text style={styles.title}>게시물별 성과</Text>
          <View style={styles.sorts}>
            <SortButton
              active={sort === "popular"}
              label="인기순"
              onPress={() => onSortChange("popular")}
            />
            <SortButton
              active={sort === "recent"}
              label="최신순"
              onPress={() => onSortChange("recent")}
            />
          </View>
        </View>

        {items.length === 0 ? (
          <Text style={styles.empty}>아직 데이터가 없어요</Text>
        ) : (
          items.map((item, index) => (
            <View key={item.postId}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <InsightsContentRow
                item={item}
                onPress={() => onOpenPost(item.postId)}
              />
            </View>
          ))
        )}
      </View>
    </View>
  );
}

function SortButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.sort, active ? styles.sortActive : null]}
    >
      <Text style={[styles.sortText, active ? styles.sortTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    gap: 16,
  },
  listCard: {
    borderRadius: 18,
    backgroundColor: c.navBackground,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 6,
  },
  title: {
    color: c.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.heavy,
  },
  sorts: {
    flexDirection: "row",
    gap: 4,
    padding: 3,
    borderRadius: 11,
    backgroundColor: c.accentSoft,
  },
  sort: {
    minWidth: 54,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  sortActive: {
    backgroundColor: c.navBackground,
  },
  sortText: {
    color: c.textFaint,
    fontSize: fontSize.footnote,
    fontWeight: fontWeight.semibold,
  },
  sortTextActive: {
    color: c.brand,
    fontWeight: fontWeight.heavy,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.border,
  },
  empty: {
    paddingVertical: 44,
    color: c.textFaint,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
});
