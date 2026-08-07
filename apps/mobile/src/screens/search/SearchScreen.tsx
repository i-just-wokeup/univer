import { useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../../components/common/ScreenContainer";
import { RecentSearchList } from "../../components/search/RecentSearchList";
import { RecommendedCrewCarousel } from "../../components/search/RecommendedCrewCarousel";
import { SearchInput } from "../../components/search/SearchInput";
import { SearchResultsList } from "../../components/search/SearchResultsList";
import type { FriendRecommendation } from "../../features/profile/api";
import { useFriendRecommendations } from "../../features/profile/useFriendRecommendations";
import { useUserSearch } from "../../features/search/useUserSearch";
import { useTheme, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

export function SearchScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
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
  const {
    dismiss: dismissRecommendation,
    recommendations,
    requestCrew,
  } = useFriendRecommendations();
  const trimmedQuery = query.trim();

  async function moveToProfile(nickname: string) {
    await recordSearch(nickname);
    router.push({ pathname: "/profile/[nickname]", params: { nickname } });
  }

  function moveToRecommendedProfile(recommendation: FriendRecommendation) {
    router.push({
      pathname: "/profile/[nickname]",
      params: { nickname: recommendation.nickname },
    });
  }

  async function requestRecommendedCrew(recommendation: FriendRecommendation) {
    try {
      await requestCrew(recommendation.userId);
    } catch {
      Alert.alert("크루 신청 실패", "잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <ScreenContainer
      contentBackgroundColor={colors.accentSoft}
      style={styles.screen}
    >
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
          <View style={styles.emptyQueryContent}>
            <RecommendedCrewCarousel
              onDismiss={dismissRecommendation}
              onPressUser={moveToRecommendedProfile}
              onRequest={(recommendation) => {
                void requestRecommendedCrew(recommendation);
              }}
              recommendations={recommendations}
            />
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
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.accentSoft,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    color: c.text,
    fontSize: fontSize.displayLarge,
    fontWeight: fontWeight.heavy,
  },
  description: {
    marginTop: 4,
    color: c.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },
  inputWrap: {
    paddingHorizontal: 16,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyQueryContent: {
    gap: 16,
  },
});
