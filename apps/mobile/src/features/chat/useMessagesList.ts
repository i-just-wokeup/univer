import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { getOrCreateConversation } from "./api";
import { useConversations } from "./hooks";
import { searchUsers, type SearchUser } from "../search/api";
import { getCurrentUserId } from "../shared/userContext";

// 대화 목록 + 현재 유저/포커스 리로드 + "대화 시작" 유저 검색/대화방 생성. UI/네비게이션은 화면이 담당.
export function useMessagesList() {
  const { active, isLoading, pending, reload } = useConversations();
  const [currentUserId, setCurrentUserId] = useState("");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    void getCurrentUserId()
      .then(setCurrentUserId)
      .catch(() => setCurrentUserId(""));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  // 입력 300ms 디바운스 후 유저 검색. 빈 입력이면 결과를 비운다.
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    // 타이머만 취소하면 이미 나간 요청은 못 막는다. 늦게 온 예전 응답이
    // 최신 결과를 덮어쓰지 않도록 정리 시점에 무효로 표시한다.
    let isStale = false;
    const timer = setTimeout(async () => {
      try {
        const users = await searchUsers(query);
        if (isStale) {
          return;
        }
        setSearchResults(users);
      } catch {
        if (isStale) {
          return;
        }
        setSearchResults([]);
      } finally {
        if (!isStale) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      isStale = true;
      clearTimeout(timer);
    };
  }, [query]);

  // 대화방 생성까지만 담당하고 conversationId를 반환한다(화면 이동은 호출부). 실패 시 null.
  async function startConversation(userId: string): Promise<string | null> {
    try {
      const conversationId = await getOrCreateConversation(userId);
      setQuery("");
      return conversationId;
    } catch {
      // 차단 등으로 대화 시작 실패 시 조용히 무시한다.
      return null;
    }
  }

  return {
    active,
    currentUserId,
    isLoading,
    isSearching,
    pending,
    query,
    searchResults,
    setQuery,
    startConversation,
  };
}
