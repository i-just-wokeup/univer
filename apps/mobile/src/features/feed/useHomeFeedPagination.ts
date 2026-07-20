import { useCallback, useEffect, useRef, useState } from "react";

import { useSession } from "../../lib/session";
import {
  getBookmarkedPostIds,
  getFeed,
  getLikedPostIds,
} from "./api";
import {
  getFeedPageCache,
  setFeedPageCache,
  type FeedPageCacheSnapshot,
} from "./page-cache";
import type { FeedPost } from "./types";

type LoadFirstPageOptions = {
  ignoreCache?: boolean;
};

export function useHomeFeedPagination() {
  const { session } = useSession();
  const currentUserId = session?.user.id ?? null;
  const initialCacheRef = useRef<FeedPageCacheSnapshot | null | undefined>(
    undefined,
  );

  if (initialCacheRef.current === undefined) {
    initialCacheRef.current = currentUserId
      ? getFeedPageCache(currentUserId)
      : null;
  }

  const initialCache = initialCacheRef.current;
  const hasLoadedFeedRef = useRef(Boolean(initialCache));
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<string>>(
    () => new Set(initialCache?.bookmarkedPostIds ?? []),
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [feedOwnerUserId, setFeedOwnerUserId] = useState<string | null>(
    currentUserId,
  );
  const [isInitialLoading, setIsInitialLoading] = useState(!initialCache);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(
    () => new Set(initialCache?.likedPostIds ?? []),
  );
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialCache?.nextCursor ?? null,
  );
  const [posts, setPosts] = useState<FeedPost[]>(
    () => initialCache?.posts ?? [],
  );

  useEffect(() => {
    if (feedOwnerUserId === currentUserId) {
      return;
    }

    const nextCache = currentUserId ? getFeedPageCache(currentUserId) : null;

    hasLoadedFeedRef.current = Boolean(nextCache);
    setBookmarkedPostIds(new Set(nextCache?.bookmarkedPostIds ?? []));
    setErrorMessage("");
    setFeedOwnerUserId(currentUserId);
    setIsInitialLoading(!nextCache);
    setLikedPostIds(new Set(nextCache?.likedPostIds ?? []));
    setNextCursor(nextCache?.nextCursor ?? null);
    setPosts(nextCache?.posts ?? []);
  }, [currentUserId, feedOwnerUserId]);

  const loadFirstPage = useCallback(async (options?: LoadFirstPageOptions) => {
    if (!options?.ignoreCache && currentUserId) {
      const cachedPage = getFeedPageCache(currentUserId);

      if (cachedPage) {
        hasLoadedFeedRef.current = true;
        setBookmarkedPostIds(new Set(cachedPage.bookmarkedPostIds));
        setErrorMessage("");
        setFeedOwnerUserId(currentUserId);
        setIsInitialLoading(false);
        setIsRefreshing(false);
        setLikedPostIds(new Set(cachedPage.likedPostIds));
        setNextCursor(cachedPage.nextCursor);
        setPosts(cachedPage.posts);
        return;
      }
    }

    try {
      setErrorMessage("");
      const result = await getFeed();
      const postIds = result.posts.map((post) => post.id);
      const [likedIds, bookmarkedIds] = await Promise.all([
        getLikedPostIds(postIds),
        getBookmarkedPostIds(postIds),
      ]);

      hasLoadedFeedRef.current = true;
      setFeedOwnerUserId(currentUserId);
      setPosts(result.posts);
      setNextCursor(result.nextCursor);
      setLikedPostIds(new Set(likedIds));
      setBookmarkedPostIds(new Set(bookmarkedIds));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "피드를 불러오지 못했습니다.",
      );
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  useEffect(() => {
    if (
      !currentUserId ||
      feedOwnerUserId !== currentUserId ||
      isInitialLoading ||
      !hasLoadedFeedRef.current
    ) {
      return;
    }

    setFeedPageCache({
      bookmarkedPostIds,
      likedPostIds,
      nextCursor,
      posts,
      userId: currentUserId,
    });
  }, [
    bookmarkedPostIds,
    currentUserId,
    feedOwnerUserId,
    isInitialLoading,
    likedPostIds,
    nextCursor,
    posts,
  ]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadFirstPage({ ignoreCache: true });
  }

  function handleRetryFirstPage() {
    setIsInitialLoading(true);
    void loadFirstPage({ ignoreCache: true });
  }

  async function handleLoadMore() {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const result = await getFeed({ cursor: nextCursor });
      const postIds = result.posts.map((post) => post.id);
      const [likedIds, bookmarkedIds] = await Promise.all([
        getLikedPostIds(postIds),
        getBookmarkedPostIds(postIds),
      ]);

      setPosts((currentPosts) => [...currentPosts, ...result.posts]);
      setNextCursor(result.nextCursor);
      setLikedPostIds((currentLikedPostIds) => {
        const nextLikedPostIds = new Set(currentLikedPostIds);
        likedIds.forEach((postId) => {
          nextLikedPostIds.add(postId);
        });
        return nextLikedPostIds;
      });
      setBookmarkedPostIds((currentBookmarkedPostIds) => {
        const nextBookmarkedPostIds = new Set(currentBookmarkedPostIds);
        bookmarkedIds.forEach((postId) => {
          nextBookmarkedPostIds.add(postId);
        });
        return nextBookmarkedPostIds;
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "피드를 더 불러오지 못했습니다.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  return {
    bookmarkedPostIds,
    errorMessage,
    handleLoadMore,
    handleRefresh,
    handleRetryFirstPage,
    isInitialLoading,
    isLoadingMore,
    isRefreshing,
    likedPostIds,
    loadFirstPage,
    posts,
    setBookmarkedPostIds,
    setErrorMessage,
    setLikedPostIds,
    setPosts,
  };
}
