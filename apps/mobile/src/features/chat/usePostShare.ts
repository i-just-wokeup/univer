import { useCallback, useEffect, useMemo, useState } from "react";

import { getFriends } from "../profile/api";
import { searchUsers } from "../search/api";
import { getCurrentUserId } from "../shared/userContext";
import {
  getConversations,
  getOrCreateConversation,
  sendPostMessage,
} from "./api";

export type PostShareTarget = {
  avatar_url: string | null;
  department: string | null;
  id: string;
  nickname: string;
  source: "conversation" | "crew" | "search";
};

function mergeTargets(targets: PostShareTarget[]) {
  const merged = new Map<string, PostShareTarget>();

  targets.forEach((target) => {
    if (!merged.has(target.id)) {
      merged.set(target.id, target);
    }
  });

  return Array.from(merged.values());
}

export function usePostShare(isOpen: boolean, canCreateStory = false) {
  const [currentUserId, setCurrentUserId] = useState("");
  const [targets, setTargets] = useState<PostShareTarget[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PostShareTarget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingTargetId, setSendingTargetId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void getCurrentUserId()
      .then(setCurrentUserId)
      .catch(() => setCurrentUserId(""));
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSearchResults([]);
      setErrorMessage(null);
      return;
    }

    let isMounted = true;

    async function loadTargets() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const [{ active }, friends] = await Promise.all([
          getConversations(),
          getFriends(),
        ]);

        if (!isMounted) {
          return;
        }

        setTargets(
          mergeTargets([
            ...active.map((conversation) => ({
              avatar_url: conversation.other_user.avatar_url,
              department: null,
              id: conversation.other_user.id,
              nickname: conversation.other_user.nickname,
              source: "conversation" as const,
            })),
            ...friends.map((friend) => ({
              avatar_url: friend.avatar_url,
              department: friend.department,
              id: friend.id,
              nickname: friend.nickname,
              source: "crew" as const,
            })),
          ]),
        );
      } catch (error) {
        if (isMounted) {
          setTargets([]);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "공유 대상을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadTargets();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const users = await searchUsers(trimmedQuery);
        setSearchResults(
          users
            .filter((user) => user.id !== currentUserId)
            .map((user) => ({
              avatar_url: user.avatar_url,
              department: user.department,
              id: user.id,
              nickname: user.nickname,
              source: "search" as const,
            })),
        );
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [currentUserId, query]);

  const visibleTargets = useMemo(
    () => (query.trim() ? searchResults : targets),
    [query, searchResults, targets],
  );

  const canAddPostToStory = useCallback(
    (postOwnerId: string) =>
      canCreateStory &&
      Boolean(currentUserId) &&
      postOwnerId === currentUserId,
    [canCreateStory, currentUserId],
  );

  async function sharePostToTarget(
    postId: string,
    targetUserId: string,
  ): Promise<string | null> {
    if (sendingTargetId) {
      return null;
    }

    try {
      setSendingTargetId(targetUserId);
      setErrorMessage(null);
      const conversationId = await getOrCreateConversation(targetUserId);
      await sendPostMessage(conversationId, postId);
      return conversationId;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "게시물을 보내지 못했습니다.",
      );
      return null;
    } finally {
      setSendingTargetId(null);
    }
  }

  return {
    canAddPostToStory,
    errorMessage,
    isLoading,
    isSearching,
    query,
    sendingTargetId,
    setQuery,
    sharePostToTarget,
    visibleTargets,
  };
}
