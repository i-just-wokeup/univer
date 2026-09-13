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
    // 타이머만 취소하면 이미 나간 요청은 못 막는다. 늦게 온 예전 응답이
    // 최신 결과를 덮어쓰지 않도록 정리 시점에 무효로 표시한다.
    let isStale = false;
    const timer = setTimeout(async () => {
      try {
        const users = await searchUsers(query);
        if (isStale) {
          return;
        }
        setResults(users);
      } catch {
        if (isStale) {
          return;
        }
        setResults([]);
      } finally {
        // 무효해진 요청은 로딩도 끄지 않는다(더 새 요청이 진행 중이다).
        if (!isStale) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      isStale = true;
      clearTimeout(timer);
    };
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
