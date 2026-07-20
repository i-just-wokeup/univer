import { useCallback, useEffect, useRef, useState } from "react";

import { useSession } from "../../lib/session";
import { getExplorePosts } from "./api";
import {
  getExplorePageCache,
  setExplorePageCache,
  type ExplorePageCacheSnapshot,
} from "./page-cache";
import type { ExplorePost } from "./types";
import { PAGE_SIZE } from "../../lib/constants/pagination";
import { prefetchImageUrls } from "../shared/imagePrefetch";

// 탐색 그리드 데이터 로드 + 무한스크롤/새로고침. masonry 배치/렌더는 화면이 담당.
export function useExploreFeed() {
  const { session } = useSession();
  const currentUserId = session?.user.id ?? null;
  const initialCacheRef = useRef<ExplorePageCacheSnapshot | null | undefined>(undefined);
  if (initialCacheRef.current === undefined) {
    initialCacheRef.current = currentUserId ? getExplorePageCache(currentUserId) : null;
  }

  const initialCache = initialCacheRef.current ?? null;
  const hasLoadedExploreRef = useRef(Boolean(initialCache));
  const [cacheOwnerUserId, setCacheOwnerUserId] = useState(currentUserId);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasMore, setHasMore] = useState(initialCache?.hasMore ?? false);
  const [isInitialLoading, setIsInitialLoading] = useState(!initialCache);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [posts, setPosts] = useState<ExplorePost[]>(initialCache?.posts ?? []);
  const offsetRef = useRef(initialCache?.offset ?? 0);

  useEffect(() => {
    if (cacheOwnerUserId === currentUserId) {
      return;
    }

    const cached = currentUserId ? getExplorePageCache(currentUserId) : null;
    setPosts(cached?.posts ?? []);
    setHasMore(cached?.hasMore ?? false);
    offsetRef.current = cached?.offset ?? 0;
    hasLoadedExploreRef.current = Boolean(cached);
    setErrorMessage("");
    setIsInitialLoading(!cached);
    setIsRefreshing(false);
    setCacheOwnerUserId(currentUserId);
  }, [cacheOwnerUserId, currentUserId]);

  const loadFirstPage = useCallback(async (options?: { ignoreCache?: boolean }) => {
    if (!options?.ignoreCache && currentUserId) {
      const cached = getExplorePageCache(currentUserId);
      if (cached) {
        setPosts(cached.posts);
        setHasMore(cached.hasMore);
        offsetRef.current = cached.offset;
        hasLoadedExploreRef.current = true;
        setErrorMessage("");
        setIsInitialLoading(false);
        setIsRefreshing(false);
        return;
      }
    }

    try {
      setErrorMessage("");
      const result = await getExplorePosts({ limit: PAGE_SIZE.explore, offset: 0 });
      prefetchImageUrls(
        result.posts.map((post) => post.thumbnail_url),
        8,
      );
      setPosts(result.posts);
      setHasMore(result.hasMore);
      offsetRef.current = PAGE_SIZE.explore;
      hasLoadedExploreRef.current = true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "탐색 게시물을 불러오지 못했습니다.",
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
    if (!currentUserId || cacheOwnerUserId !== currentUserId || !hasLoadedExploreRef.current) {
      return;
    }

    setExplorePageCache({
      hasMore,
      offset: offsetRef.current,
      posts,
      userId: currentUserId,
    });
  }, [cacheOwnerUserId, currentUserId, hasMore, posts]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadFirstPage({ ignoreCache: true });
  }

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const result = await getExplorePosts({
        limit: PAGE_SIZE.explore,
        offset: offsetRef.current,
      });
      prefetchImageUrls(
        result.posts.map((post) => post.thumbnail_url),
        8,
      );
      setPosts((current) => [...current, ...result.posts]);
      setHasMore(result.hasMore);
      offsetRef.current += PAGE_SIZE.explore;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "탐색 게시물을 더 불러오지 못했습니다.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore]);

  function retry() {
    setIsInitialLoading(true);
    void loadFirstPage({ ignoreCache: true });
  }

  return {
    errorMessage,
    handleLoadMore,
    handleRefresh,
    isInitialLoading,
    isLoadingMore,
    isRefreshing,
    posts,
    retry,
  };
}
