import { useFocusEffect, useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SearchInput } from "../../components/search/SearchInput";
import { SearchUserRow } from "../../components/search/SearchUserRow";
import { searchUsers, type SearchUser } from "../../features/search/api";
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  removeSearchHistory,
} from "../../features/search/history";
import { colors } from "../../lib/theme";

export function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadRecent = useCallback(async () => {
    setRecentSearches(await getSearchHistory());
  }, []);

  // 탭에 들어올 때 최근 검색을 갱신하고, 탭을 떠나면 입력/결과를 비운다.
  useFocusEffect(
    useCallback(() => {
      void loadRecent();

      return () => {
        setQuery("");
        setResults([]);
      };
    }, [loadRecent]),
  );

  // 입력 300ms 디바운스 후 검색. 빈 입력이면 결과를 비운다.
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        setResults(await searchUsers(query));
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  async function moveToProfile(nickname: string) {
    await addSearchHistory(nickname);
    await loadRecent();
    router.push({ pathname: "/profile/[nickname]", params: { nickname } });
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>검색</Text>
        <Text style={styles.description}>닉네임과 해시태그를 찾아보세요</Text>
      </View>

      <View style={styles.inputWrap}>
        <SearchInput onChange={setQuery} value={query} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {query.trim() ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>검색 결과</Text>
              <Text numberOfLines={1} style={styles.cardEyebrow}>
                {query.trim()}
              </Text>
            </View>

            {isLoading ? (
              <Text style={styles.stateText}>검색 중입니다…</Text>
            ) : results.length === 0 ? (
              <Text style={styles.stateText}>검색 결과가 없습니다.</Text>
            ) : (
              results.map((user) => (
                <SearchUserRow
                  key={user.id}
                  onPress={(selected) => {
                    void moveToProfile(selected.nickname);
                  }}
                  user={user}
                />
              ))
            )}
          </View>
        ) : recentSearches.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.stateText}>최근 검색 항목이 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>최근 검색</Text>
              <Pressable
                accessibilityRole="button"
                hitSlop={6}
                onPress={() => {
                  void (async () => {
                    await clearSearchHistory();
                    setRecentSearches([]);
                  })();
                }}
              >
                <Text style={styles.clearAllText}>모두 지우기</Text>
              </Pressable>
            </View>

            {recentSearches.map((item) => (
              <View key={item} style={styles.recentRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void moveToProfile(item);
                  }}
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
                  onPress={() => {
                    void (async () => {
                      await removeSearchHistory(item);
                      await loadRecent();
                    })();
                  }}
                  style={styles.recentRemove}
                >
                  <X color={colors.muted} size={16} strokeWidth={2.6} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
  },
  description: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  inputWrap: {
    paddingHorizontal: 16,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 22,
    backgroundColor: colors.card,
    padding: 8,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 22,
    backgroundColor: colors.card,
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
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  cardEyebrow: {
    maxWidth: "55%",
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
  },
  clearAllText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  stateText: {
    paddingVertical: 28,
    color: colors.muted,
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
    color: colors.text,
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
    backgroundColor: colors.white,
  },
});
