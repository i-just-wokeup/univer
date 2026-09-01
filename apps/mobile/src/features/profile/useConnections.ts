import { useCallback, useEffect, useRef, useState } from "react";

import {
  acceptFriendRequest,
  getFriends,
  getPendingRequests,
  getSentRequests,
  rejectFriendRequest,
  removeFriend,
} from "./api";
import type { ConnectionUser } from "./types";
import type { ConnectionTab } from "../../components/profile/ConnectionTabs";

const INITIAL_CONNECTIONS: Record<ConnectionTab, ConnectionUser[] | null> = {
  friends: null,
  received: null,
  sent: null,
};

// 크루 관리 탭별 데이터 로딩 + 수락/거절/취소/삭제(낙관적) 로직. UI/네비게이션은 화면이 담당.
export function useConnections() {
  const [activeTab, setActiveTab] = useState<ConnectionTab>("friends");
  const [connectionsByTab, setConnectionsByTab] =
    useState<Record<ConnectionTab, ConnectionUser[] | null>>(INITIAL_CONNECTIONS);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingTab, setLoadingTab] = useState<ConnectionTab | null>("friends");
  const [refreshingTab, setRefreshingTab] = useState<ConnectionTab | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = useCallback((message: string) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    setFeedbackMessage(message);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackMessage("");
      feedbackTimerRef.current = null;
    }, 1800);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const loadConnections = useCallback(
    async (tab: ConnectionTab, force = false) => {
      if (!force && connectionsByTab[tab] !== null) {
        return;
      }

      try {
        setErrorMessage("");
        setLoadingTab(tab);

        const nextConnections =
          tab === "friends"
            ? await getFriends()
            : tab === "received"
              ? await getPendingRequests()
              : await getSentRequests();

        setConnectionsByTab((current) => ({
          ...current,
          [tab]: nextConnections,
        }));
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "크루 목록을 불러오지 못했습니다.",
        );
        setConnectionsByTab((current) => ({
          ...current,
          [tab]: [],
        }));
      } finally {
        setLoadingTab(null);
        setRefreshingTab(null);
      }
    },
    [connectionsByTab],
  );

  useEffect(() => {
    void loadConnections(activeTab);
  }, [activeTab, loadConnections]);

  async function runConnectionAction({
    action,
    invalidateFriends = false,
    tab,
    userId,
  }: {
    action: () => Promise<void>;
    invalidateFriends?: boolean;
    tab: ConnectionTab;
    userId: string;
  }): Promise<boolean> {
    const previousConnections = connectionsByTab[tab] ?? [];

    setBusyUserId(userId);
    setErrorMessage("");
    setConnectionsByTab((current) => {
      const next = {
        ...current,
        [tab]: previousConnections.filter((user) => user.id !== userId),
      };

      // 수락 시 친구 캐시를 무효화하되, 친구 탭 자신을 덮어쓰지 않도록 분리.
      if (invalidateFriends && tab !== "friends") {
        next.friends = null;
      }

      return next;
    });

    try {
      await action();
      return true;
    } catch (error) {
      setConnectionsByTab((current) => ({
        ...current,
        [tab]: previousConnections,
      }));
      setErrorMessage(
        error instanceof Error ? error.message : "크루 신청 처리에 실패했습니다.",
      );
      return false;
    } finally {
      setBusyUserId(null);
    }
  }

  function acceptUser(userId: string) {
    void runConnectionAction({
      action: () => acceptFriendRequest(userId),
      invalidateFriends: true,
      tab: activeTab,
      userId,
    });
  }

  function rejectUser(userId: string) {
    void runConnectionAction({
      action: () => rejectFriendRequest(userId),
      tab: activeTab,
      userId,
    });
  }

  // 삭제 성공 시 true 반환(확인 다이얼로그/토스트는 호출부).
  function removeUser(userId: string): Promise<boolean> {
    return runConnectionAction({
      action: () => removeFriend(userId),
      tab: activeTab,
      userId,
    });
  }

  function refresh() {
    setRefreshingTab(activeTab);
    void loadConnections(activeTab, true);
  }

  function retry() {
    void loadConnections(activeTab, true);
  }

  const currentConnections = connectionsByTab[activeTab];
  const isLoading = loadingTab === activeTab && currentConnections === null;
  const shouldShowLoadError =
    Boolean(errorMessage) &&
    (!currentConnections || currentConnections.length === 0);

  return {
    acceptUser,
    activeTab,
    busyUserId,
    currentConnections,
    errorMessage,
    feedbackMessage,
    isLoading,
    isRefreshing: refreshingTab === activeTab,
    refresh,
    rejectUser,
    removeUser,
    retry,
    setActiveTab,
    shouldShowLoadError,
    showFeedback,
  };
}
