import { useCallback, useEffect, useRef, useState } from "react";

import { getExplorePosts } from "./api";
import type { ExplorePost } from "./types";
import { PAGE_SIZE } from "../../lib/constants/pagination";
import { prefetchImageUrls } from "../shared/imagePrefetch";

// 탐색 그리드 데이터 로드 + 무한스크롤/새로고침. masonry 배치/렌더는 화면이 담당.
export function useExploreFeed() {
  const [errorMessage, setErrorMessage] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const offsetRef = useRef(0);

  const loadFirstPage = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadFirstPage();
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
    void loadFirstPage();
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
