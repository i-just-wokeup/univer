import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../../components/common/ScreenContainer";
import { RecentSearchList } from "../../components/search/RecentSearchList";
import { SearchInput } from "../../components/search/SearchInput";
import { SearchResultsList } from "../../components/search/SearchResultsList";
import { useUserSearch } from "../../features/search/useUserSearch";
import { colors } from "../../lib/theme";

export function SearchScreen() {
  const router = useRouter();
  const {
    clearRecent,
    isLoading,
    query,
    recentSearches,
    recordSearch,
    removeRecent,
    results,
    setQuery,
  } = useUserSearch();
  const trimmedQuery = query.trim();

  async function moveToProfile(nickname: string) {
    await recordSearch(nickname);
    router.push({ pathname: "/profile/[nickname]", params: { nickname } });
  }

  return (
    <ScreenContainer style={styles.screen}>
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
        {trimmedQuery ? (
          <SearchResultsList
            isLoading={isLoading}
            onPressUser={(user) => {
              void moveToProfile(user.nickname);
            }}
            query={trimmedQuery}
            results={results}
          />
        ) : (
          <RecentSearchList
            onClearAll={() => {
              void clearRecent();
            }}
            onPressRecent={(item) => {
              void moveToProfile(item);
            }}
            onRemoveRecent={(item) => {
              void removeRecent(item);
            }}
            recentSearches={recentSearches}
          />
        )}
      </ScrollView>
    </ScreenContainer>
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
});
