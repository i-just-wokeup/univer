import { X } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type RecentSearchListProps = {
  onClearAll: () => void;
  onPressRecent: (nickname: string) => void;
  onRemoveRecent: (nickname: string) => void;
  recentSearches: string[];
};

// 순수 UI. 최근 검색 카드(비었으면 안내, 있으면 목록 + 개별 삭제/전체 삭제). 저장/이동은 화면·훅이 담당.
export function RecentSearchList({
  onClearAll,
  onPressRecent,
  onRemoveRecent,
  recentSearches,
}: RecentSearchListProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (recentSearches.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.stateText}>최근 검색 항목이 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>최근 검색</Text>
        <Pressable accessibilityRole="button" hitSlop={6} onPress={onClearAll}>
          <Text style={styles.clearAllText}>모두 지우기</Text>
        </Pressable>
      </View>

      {recentSearches.map((item) => (
        <View key={item} style={styles.recentRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onPressRecent(item)}
            style={styles.recentLabel}
          >
            <Text numberOfLines={1} style={styles.recentText}>
              {item}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`${item} 최근 검색 삭제`}
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => onRemoveRecent(item)}
            style={styles.recentRemove}
          >
            <X color={colors.muted} size={16} strokeWidth={2.6} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    borderRadius: 22,
    backgroundColor: c.card,
    padding: 8,
  },
  emptyCard: {
    borderRadius: 22,
    backgroundColor: c.card,
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
  },
  cardTitle: {
    color: c.text,
    fontSize: 14,
    fontWeight: "900",
  },
  clearAllText: {
    color: c.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  stateText: {
    paddingVertical: 28,
    color: c.muted,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  recentLabel: {
    flex: 1,
    minWidth: 0,
  },
  recentText: {
    color: c.text,
    fontSize: 14,
    fontWeight: "800",
  },
  recentRemove: {
    marginLeft: 12,
    height: 30,
    width: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: c.navBackground,
  },
});
