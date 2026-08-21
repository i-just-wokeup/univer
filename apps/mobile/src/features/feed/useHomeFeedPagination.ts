import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useSession } from "../../lib/session";
import { prefetchImageUrls } from "../shared/imagePrefetch";
import {
  getBookmarkedPostIds,
  getFeedRanked,
  getLikedPostIds,
  getPost,
} from "./api";
import {
  getFeedPageCache,
  setFeedPageCache,
  type FeedPageCacheSnapshot,
} from "./page-cache";
import { consumePendingUploadedPost } from "./pendingUploadedPost";
import type { FeedPost, FeedPostRank, FeedRankCursor } from "./types";

type LoadFirstPageOptions = {
  ignoreCache?: boolean;
  seed?: number;
};

function getFeedPrefetchUrls(posts: FeedPost[]) {
  return posts.flatMap((post) =>
    post.media.map((media) =>
      media.type === "video" ? media.thumbnail_url : media.url,
    ),
  );
}

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
  const [nextCursor, setNextCursor] = useState<FeedRankCursor | null>(
    initialCache?.nextCursor ?? null,
  );
  const [postRanks, setPostRanks] = useState<Map<string, FeedPostRank>>(
    () => new Map(initialCache?.postRanks ?? []),
  );
  const [posts, setPosts] = useState<FeedPost[]>(
    () => initialCache?.posts ?? [],
  );
  const firstPageGenerationRef = useRef(0);
  const postsRef = useRef<FeedPost[]>(initialCache?.posts ?? []);
  const seedRef = useRef(initialCache?.seed ?? Math.random());

  postsRef.current = posts;

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
    setPostRanks(new Map(nextCache?.postRanks ?? []));
    setPosts(nextCache?.posts ?? []);
    seedRef.current = nextCache?.seed ?? Math.random();
  }, [currentUserId, feedOwnerUserId]);

  const prependPendingUploadedPost = useCallback(async () => {
    if (!currentUserId || !hasLoadedFeedRef.current) {
      return;
    }

    const postId = consumePendingUploadedPost();

    if (!postId) {
      return;
    }

    const requestGeneration = firstPageGenerationRef.current;

    try {
      const post = await getPost(postId);

      if (
        firstPageGenerationRef.current !== requestGeneration ||
        post.user.id !== currentUserId
      ) {
        return;
      }

      setPosts((currentPosts) => {
        if (currentPosts.some((currentPost) => currentPost.id === post.id)) {
          return currentPosts;
        }

        return [post, ...currentPosts];
      });
    } catch {
      // 임시 홈 표시 실패는 이미 성공한 게시물 작성을 실패로 바꾸지 않는다.
    }
  }, [currentUserId]);

  useFocusEffect(
    useCallback(() => {
      void prependPendingUploadedPost();
    }, [prependPendingUploadedPost]),
  );

  const loadFirstPage = useCallback(async (options?: LoadFirstPageOptions) => {
    const requestSeed = options?.seed ?? seedRef.current;

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
        setPostRanks(new Map(cachedPage.postRanks));
        setPosts(cachedPage.posts);
        seedRef.current = cachedPage.seed;
        void prependPendingUploadedPost();
        return;
      }
    }

    firstPageGenerationRef.current += 1;

    try {
      setErrorMessage("");
      const result = await getFeedRanked({ seed: requestSeed });
      const postIds = result.posts.map((post) => post.id);
      const [likedIds, bookmarkedIds] = await Promise.all([
        getLikedPostIds(postIds),
        getBookmarkedPostIds(postIds),
      ]);

      prefetchImageUrls(getFeedPrefetchUrls(result.posts), 10);
      hasLoadedFeedRef.current = true;
      setFeedOwnerUserId(currentUserId);
      setPosts(result.posts);
      setNextCursor(result.nextCursor);
      setPostRanks(result.postRanks);
      seedRef.current = requestSeed;
      setLikedPostIds(new Set(likedIds));
      setBookmarkedPostIds(new Set(bookmarkedIds));
      void prependPendingUploadedPost();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "피드를 불러오지 못했습니다.",
      );
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUserId, prependPendingUploadedPost]);

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
      postRanks,
      posts,
      seed: seedRef.current,
      userId: currentUserId,
    });
  }, [
    bookmarkedPostIds,
    currentUserId,
    feedOwnerUserId,
    isInitialLoading,
    likedPostIds,
    nextCursor,
    postRanks,
    posts,
  ]);

  const handleRefresh = useCallback(async () => {
    const nextSeed = Math.random();

    seedRef.current = nextSeed;
    setIsRefreshing(true);
    await loadFirstPage({ ignoreCache: true, seed: nextSeed });
  }, [loadFirstPage]);

  const handleRetryFirstPage = useCallback(() => {
    setIsInitialLoading(true);
    void loadFirstPage({ ignoreCache: true });
  }, [loadFirstPage]);

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const result = await getFeedRanked({
        afterBand: nextCursor.band,
        afterRank: nextCursor.rank,
        seed: seedRef.current,
      });
      const loadedPostIds = new Set(postsRef.current.map((post) => post.id));
      const nextPosts = result.posts.filter(
        (post) => !loadedPostIds.has(post.id),
      );
      const postIds = nextPosts.map((post) => post.id);
      const [likedIds, bookmarkedIds] = await Promise.all([
        getLikedPostIds(postIds),
        getBookmarkedPostIds(postIds),
      ]);

      prefetchImageUrls(getFeedPrefetchUrls(nextPosts), 8);
      setPosts((currentPosts) => {
        const currentPostIds = new Set(currentPosts.map((post) => post.id));
        const dedupedNextPosts = nextPosts.filter(
          (post) => !currentPostIds.has(post.id),
        );
        return [...currentPosts, ...dedupedNextPosts];
      });
      setNextCursor(result.nextCursor);
      setPostRanks((currentPostRanks) => {
        const nextPostRanks = new Map(currentPostRanks);
        result.postRanks.forEach((rank, postId) => {
          nextPostRanks.set(postId, rank);
        });
        return nextPostRanks;
      });
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
  }, [isLoadingMore, nextCursor]);

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
    postRanks,
    posts,
    setBookmarkedPostIds,
    setErrorMessage,
    setLikedPostIds,
    setPosts,
  };
}
