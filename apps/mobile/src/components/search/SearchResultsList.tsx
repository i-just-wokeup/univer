import { StyleSheet, Text, View } from "react-native";

import type { SearchUser } from "../../features/search/api";
import { useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { SearchUserRow } from "./SearchUserRow";

type SearchResultsListProps = {
  isLoading: boolean;
  onPressUser: (user: SearchUser) => void;
  query: string;
  results: SearchUser[];
};

// 순수 UI. 검색 결과 카드(헤더 + 로딩/빈 상태/결과 행 목록). 이동/검색 로직은 화면·훅이 담당.
export function SearchResultsList({
  isLoading,
  onPressUser,
  query,
  results,
}: SearchResultsListProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>검색 결과</Text>
        <Text numberOfLines={1} style={styles.cardEyebrow}>
          {query}
        </Text>
      </View>

      {isLoading ? (
        <Text style={styles.stateText}>검색 중입니다…</Text>
      ) : results.length === 0 ? (
        <Text style={styles.stateText}>검색 결과가 없습니다.</Text>
      ) : (
        results.map((user) => (
          <SearchUserRow key={user.id} onPress={onPressUser} user={user} />
        ))
      )}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    borderRadius: 22,
    backgroundColor: c.card,
    padding: 8,
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
  cardEyebrow: {
    maxWidth: "55%",
    color: c.accent,
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
});
