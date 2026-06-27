import { useCallback, useEffect, useState } from "react";

import { getOrCreateConversation } from "../chat/api";
import {
  acceptFriendRequest,
  getConnectionStatus,
  getFavoriteUserStatus,
  getProfile,
  getProfileCounts,
  getProfilePosts,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
  toggleUserFavorite,
} from "./api";
import type {
  ConnectionStatus,
  ProfileCounts,
  ProfileDetail,
  ProfileGridPost,
} from "./types";

// 프로필 화면 데이터 + 크루(친구)/즐겨찾기 액션 로직. UI/네비게이션은 화면이 담당.
export function useProfile(nickname?: string) {
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [counts, setCounts] = useState<ProfileCounts>({ crew: 0, posts: 0 });
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus | null>(null);
  const [posts, setPosts] = useState<ProfileGridPost[]>([]);
  const [isMine, setIsMine] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionPending, setIsActionPending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setErrorMessage("");
      const { isMine: loadedIsMine, profile: loaded } =
        await getProfile(nickname);
      setProfile(loaded);
      setIsMine(loadedIsMine);

      const [loadedCounts, loadedPosts, loadedConnectionStatus, favoriteStatus] =
        await Promise.all([
          getProfileCounts(loaded.id),
          getProfilePosts(loaded.id),
          loadedIsMine ? Promise.resolve(null) : getConnectionStatus(loaded.id),
          loadedIsMine
            ? Promise.resolve(false)
            : getFavoriteUserStatus(loaded.id),
        ]);
      setCounts(
        loadedConnectionStatus
          ? { ...loadedCounts, crew: loadedConnectionStatus.friends_count }
          : loadedCounts,
      );
      setConnectionStatus(loadedConnectionStatus);
      setIsFavorite(favoriteStatus);
      setPosts(loadedPosts);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "프로필을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [nickname]);

  useEffect(() => {
    void load();
  }, [load]);

  function refresh() {
    setIsRefreshing(true);
    void load();
  }

  function retry() {
    setIsLoading(true);
    void load();
  }

  async function refreshConnectionStatus(profileId: string) {
    const nextConnectionStatus = await getConnectionStatus(profileId);
    setConnectionStatus(nextConnectionStatus);
    setCounts((currentCounts) => ({
      ...currentCounts,
      crew: nextConnectionStatus.friends_count,
    }));
  }

  async function runConnectionAction({
    action,
    optimisticStatus,
  }: {
    action: () => Promise<void>;
    optimisticStatus: ConnectionStatus;
  }) {
    if (!profile || isMine || !connectionStatus || isActionPending) {
      return;
    }

    const previousConnectionStatus = connectionStatus;
    const previousCounts = counts;

    setIsActionPending(true);
    setErrorMessage("");
    setConnectionStatus(optimisticStatus);
    setCounts((currentCounts) => ({
      ...currentCounts,
      crew: optimisticStatus.friends_count,
    }));

    try {
      await action();
      await refreshConnectionStatus(profile.id);
    } catch (error) {
      setConnectionStatus(previousConnectionStatus);
      setCounts(previousCounts);
      setErrorMessage(
        error instanceof Error ? error.message : "친구 상태를 변경하지 못했습니다.",
      );
    } finally {
      setIsActionPending(false);
    }
  }

  function handleSendFriendRequest() {
    if (!profile || !connectionStatus) {
      return;
    }

    void runConnectionAction({
      action: () => sendFriendRequest(profile.id),
      optimisticStatus: {
        ...connectionStatus,
        is_requester: true,
        status: "pending",
      },
    });
  }

  function handleAcceptFriendRequest() {
    if (!profile || !connectionStatus) {
      return;
    }

    void runConnectionAction({
      action: () => acceptFriendRequest(profile.id),
      optimisticStatus: {
        friends_count: connectionStatus.friends_count + 1,
        is_requester: false,
        status: "accepted",
      },
    });
  }

  function handleRejectFriendRequest() {
    if (!profile || !connectionStatus) {
      return;
    }

    void runConnectionAction({
      action: () => rejectFriendRequest(profile.id),
      optimisticStatus: {
        ...connectionStatus,
        is_requester: false,
        status: "none",
      },
    });
  }

  function handleRemoveFriend() {
    if (!profile || !connectionStatus) {
      return;
    }

    void runConnectionAction({
      action: () => removeFriend(profile.id),
      optimisticStatus: {
        friends_count:
          connectionStatus.status === "accepted"
            ? Math.max(0, connectionStatus.friends_count - 1)
            : connectionStatus.friends_count,
        is_requester: false,
        status: "none",
      },
    });
  }

  async function handleToggleFavorite() {
    if (!profile || isMine || isActionPending) {
      return;
    }

    const previousIsFavorite = isFavorite;
    setIsActionPending(true);
    setErrorMessage("");
    setIsFavorite(!previousIsFavorite);

    try {
      const result = await toggleUserFavorite(profile.id);
      setIsFavorite(result.favorited);
    } catch (error) {
      setIsFavorite(previousIsFavorite);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "즐겨찾기 상태를 변경하지 못했습니다.",
      );
    } finally {
      setIsActionPending(false);
    }
  }

  // 대화방 생성까지만 담당하고 conversationId를 반환한다(화면 이동은 호출부에서).
  async function startConversation(): Promise<string | null> {
    if (!profile || isMine || isActionPending) {
      return null;
    }

    try {
      setIsActionPending(true);
      setErrorMessage("");
      return await getOrCreateConversation(profile.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "대화를 시작하지 못했습니다.",
      );
      return null;
    } finally {
      setIsActionPending(false);
    }
  }

  return {
    connectionStatus,
    counts,
    errorMessage,
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
    handleRemoveFriend,
    handleSendFriendRequest,
    handleToggleFavorite,
    isActionPending,
    isFavorite,
    isLoading,
    isMine,
    isRefreshing,
    posts,
    profile,
    refresh,
    retry,
    startConversation,
  };
}
