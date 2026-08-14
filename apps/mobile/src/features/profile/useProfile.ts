import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking } from "react-native";

import { useSession } from "../../lib/session";
import { recordMetric } from "../metrics/api";
import { getOrCreateConversation } from "../chat/api";
import { normalizeProfileUrl } from "../../lib/utils/profileLinks";
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
import {
  getProfilePageCache,
  setProfilePageCache,
  type ProfilePageCacheSnapshot,
} from "./page-cache";
import type {
  ConnectionStatus,
  ProfileCounts,
  ProfileDetail,
  ProfileGridPost,
  ProfileLink,
} from "./types";

// 프로필 화면 데이터 + 크루(친구)/즐겨찾기 액션 로직. UI/네비게이션은 화면이 담당.
export function useProfile(nickname?: string) {
  const { session } = useSession();
  const currentUserId = session?.user.id ?? null;
  const cacheKey = `${currentUserId ?? "anonymous"}:${nickname ?? "__me__"}`;
  const initialCacheRef = useRef<ProfilePageCacheSnapshot | null | undefined>(undefined);
  if (initialCacheRef.current === undefined) {
    initialCacheRef.current = currentUserId
      ? getProfilePageCache({ currentUserId, nickname })
      : null;
  }

  const initialCache = initialCacheRef.current ?? null;
  const hasLoadedProfileRef = useRef(Boolean(initialCache));
  const [profileCacheKey, setProfileCacheKey] = useState(cacheKey);
  const [profile, setProfile] = useState<ProfileDetail | null>(
    initialCache?.profile ?? null,
  );
  const [counts, setCounts] = useState<ProfileCounts>(
    initialCache?.counts ?? { crew: 0, posts: 0 },
  );
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus | null>(initialCache?.connectionStatus ?? null);
  const [posts, setPosts] = useState<ProfileGridPost[]>(initialCache?.posts ?? []);
  const [isMine, setIsMine] = useState(initialCache?.isMine ?? false);
  const [isFavorite, setIsFavorite] = useState(initialCache?.isFavorite ?? false);
  const [isLoading, setIsLoading] = useState(!initialCache);
  const [isActionPending, setIsActionPending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  // 이 화면 마운트 동안 프로필 방문을 한 번만 기록(포커스 복귀마다 중복 방지).
  const visitRecordedRef = useRef(false);

  const recordProfileVisit = useCallback(
    (loadedProfile: ProfileDetail, loadedIsMine: boolean) => {
      // 캐시 히트로 네트워크 로드를 건너뛰어도 방문 지표는 기존 규칙대로 기록한다.
      if (!loadedIsMine && !visitRecordedRef.current) {
        visitRecordedRef.current = true;
        void recordMetric("profile_visit", loadedProfile.id);
      }
    },
    [],
  );

  useEffect(() => {
    if (profileCacheKey === cacheKey) {
      return;
    }

    const cached = currentUserId
      ? getProfilePageCache({ currentUserId, nickname })
      : null;
    setProfile(cached?.profile ?? null);
    setCounts(cached?.counts ?? { crew: 0, posts: 0 });
    setConnectionStatus(cached?.connectionStatus ?? null);
    setPosts(cached?.posts ?? []);
    setIsMine(cached?.isMine ?? false);
    setIsFavorite(cached?.isFavorite ?? false);
    hasLoadedProfileRef.current = Boolean(cached);
    visitRecordedRef.current = false;
    setErrorMessage("");
    setIsLoading(!cached);
    setIsRefreshing(false);
    setProfileCacheKey(cacheKey);
  }, [cacheKey, currentUserId, nickname, profileCacheKey]);

  const load = useCallback(async (options?: { ignoreCache?: boolean }) => {
    if (!options?.ignoreCache && currentUserId) {
      const cached = getProfilePageCache({ currentUserId, nickname });
      if (cached) {
        setProfile(cached.profile);
        setCounts(cached.counts);
        setConnectionStatus(cached.connectionStatus);
        setPosts(cached.posts);
        setIsMine(cached.isMine);
        setIsFavorite(cached.isFavorite);
        hasLoadedProfileRef.current = true;
        recordProfileVisit(cached.profile, cached.isMine);
        setErrorMessage("");
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }
    }

    try {
      setErrorMessage("");
      const { isMine: loadedIsMine, profile: loaded } =
        await getProfile(nickname);
      setProfile(loaded);
      setIsMine(loadedIsMine);

      // 남의 프로필 방문 기록(본인 것은 서버가 제외). target·owner 모두 프로필 주인.
      recordProfileVisit(loaded, loadedIsMine);

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
      hasLoadedProfileRef.current = true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "프로필을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUserId, nickname, recordProfileVisit]);

  // 화면에 진입/복귀할 때마다 최신 프로필을 다시 불러온다(편집 저장 후 돌아오면 자동 반영).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (
      !currentUserId ||
      profileCacheKey !== cacheKey ||
      !hasLoadedProfileRef.current ||
      !profile
    ) {
      return;
    }

    setProfilePageCache({
      connectionStatus,
      counts,
      currentUserId,
      isFavorite,
      isMine,
      nickname,
      posts,
      profile,
    });
  }, [
    cacheKey,
    connectionStatus,
    counts,
    currentUserId,
    isFavorite,
    isMine,
    nickname,
    posts,
    profile,
    profileCacheKey,
  ]);

  function refresh() {
    setIsRefreshing(true);
    void load({ ignoreCache: true });
  }

  function retry() {
    setIsLoading(true);
    void load({ ignoreCache: true });
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

  // 프로필 링크 탭: 클릭 지표 기록(본인 제외·중복제거는 서버가 처리) 후 링크를 연다.
  function handleLinkPress(link: ProfileLink) {
    if (profile) {
      void recordMetric("link_click", link.id);
    }
    const safeUrl = normalizeProfileUrl(link.url);
    if (safeUrl) {
      void Linking.openURL(safeUrl);
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
    handleLinkPress,
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
