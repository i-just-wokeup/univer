import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { searchUsers, type SearchUser } from "./api";
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  removeSearchHistory,
} from "./history";

// 유저 검색 상태 + 디바운스 검색 + 최근 검색 관리. 프로필 이동은 화면이 담당.
export function useUserSearch() {
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

  // 최근 검색에 기록하고 목록을 갱신한다(화면 이동은 호출부).
  async function recordSearch(nickname: string) {
    await addSearchHistory(nickname);
    await loadRecent();
  }

  async function clearRecent() {
    await clearSearchHistory();
    setRecentSearches([]);
  }

  async function removeRecent(nickname: string) {
    await removeSearchHistory(nickname);
    await loadRecent();
  }

  return {
    clearRecent,
    isLoading,
    query,
    recentSearches,
    recordSearch,
    removeRecent,
    results,
    setQuery,
  };
}
