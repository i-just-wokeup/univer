import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { getFriendRecommendations, sendFriendRequest } from "./api";
import type { FriendRecommendation } from "./types";

export function useFriendRecommendations() {
  const [recommendations, setRecommendations] = useState<FriendRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hiddenIdsRef = useRef(new Set<string>());
  const itemsRef = useRef<FriendRecommendation[]>([]);
  const requestingIdsRef = useRef(new Set<string>());
  const seedRef = useRef(Math.random());

  const replaceRecommendations = useCallback((next: FriendRecommendation[]) => {
    itemsRef.current = next;
    setRecommendations(next);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      const next = await getFriendRecommendations(seedRef.current);
      replaceRecommendations(
        next.filter((item) => !hiddenIdsRef.current.has(item.userId)),
      );
    } catch {
      replaceRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, [replaceRecommendations]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const removeLocally = useCallback((userId: string) => {
    const index = itemsRef.current.findIndex((item) => item.userId === userId);

    if (index < 0) {
      return null;
    }

    const item = itemsRef.current[index];
    const next = itemsRef.current.filter((candidate) => candidate.userId !== userId);
    itemsRef.current = next;
    setRecommendations(next);

    return { index, item };
  }, []);

  const dismiss = useCallback((userId: string) => {
    hiddenIdsRef.current.add(userId);
    removeLocally(userId);
  }, [removeLocally]);

  const requestCrew = useCallback(async (userId: string) => {
    if (requestingIdsRef.current.has(userId)) {
      return;
    }

    requestingIdsRef.current.add(userId);
    hiddenIdsRef.current.add(userId);
    const removed = removeLocally(userId);

    try {
      await sendFriendRequest(userId);
    } catch (error) {
      hiddenIdsRef.current.delete(userId);

      if (removed && !itemsRef.current.some((item) => item.userId === userId)) {
        const next = [...itemsRef.current];
        next.splice(Math.min(removed.index, next.length), 0, removed.item);
        itemsRef.current = next;
        setRecommendations(next);
      }

      throw error;
    } finally {
      requestingIdsRef.current.delete(userId);
    }
  }, [removeLocally]);

  return {
    dismiss,
    isLoading,
    recommendations,
    refresh,
    requestCrew,
  };
}
