import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { getFollowerCount, getFollowState, toggleFollow } from "./api";

type UseProfileFollowParams = {
  canToggle: boolean;
  enabled: boolean;
  targetUserId: string | null;
};

export function useProfileFollow({
  canToggle,
  enabled,
  targetUserId,
}: UseProfileFollowParams) {
  const requestIdRef = useRef(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!enabled || !targetUserId) {
      setFollowerCount(0);
      setIsFollowing(false);
      setIsReady(false);
      setIsActionPending(false);
      setErrorMessage("");
      return;
    }

    setIsReady(false);
    setErrorMessage("");

    try {
      const [nextFollowerCount, nextIsFollowing] = await Promise.all([
        getFollowerCount(targetUserId),
        canToggle ? getFollowState(targetUserId) : Promise.resolve(false),
      ]);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setFollowerCount(nextFollowerCount);
      setIsFollowing(nextIsFollowing);
      setIsReady(true);
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "팔로우 상태를 불러오지 못했습니다.",
      );
    }
  }, [canToggle, enabled, targetUserId]);

  useFocusEffect(
    useCallback(() => {
      void load();

      return () => {
        requestIdRef.current += 1;
      };
    }, [load]),
  );

  const handleToggleFollow = useCallback(() => {
    if (
      !canToggle ||
      !enabled ||
      !targetUserId ||
      !isReady ||
      isActionPending
    ) {
      return;
    }

    const previousFollowerCount = followerCount;
    const previousIsFollowing = isFollowing;
    const optimisticIsFollowing = !previousIsFollowing;

    setIsActionPending(true);
    setErrorMessage("");
    setIsFollowing(optimisticIsFollowing);
    setFollowerCount(
      Math.max(0, previousFollowerCount + (optimisticIsFollowing ? 1 : -1)),
    );

    void toggleFollow(targetUserId)
      .then(({ following }) => {
        setIsFollowing(following);
        setFollowerCount(
          Math.max(
            0,
            previousFollowerCount +
              (following === previousIsFollowing ? 0 : following ? 1 : -1),
          ),
        );
      })
      .catch((error: unknown) => {
        setFollowerCount(previousFollowerCount);
        setIsFollowing(previousIsFollowing);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "팔로우 상태를 변경하지 못했습니다.",
        );
      })
      .finally(() => {
        setIsActionPending(false);
      });
  }, [
    canToggle,
    enabled,
    followerCount,
    isActionPending,
    isFollowing,
    isReady,
    targetUserId,
  ]);

  return {
    errorMessage,
    followerCount,
    handleToggleFollow,
    isActionPending,
    isFollowing,
    isReady,
    refresh: load,
  };
}
