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
import {
  getRecentUploadIds,
  RECENT_UPLOAD_WINDOW_MS,
} from "./pendingUploadedPost";
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

  const prependRecentUploads = useCallback(async (basePosts?: FeedPost[]) => {
    if (!currentUserId || !hasLoadedFeedRef.current) {
      return;
    }

    const recentUploadIds = getRecentUploadIds(RECENT_UPLOAD_WINDOW_MS);
    const recentUploadIdSet = new Set(recentUploadIds);
    const sourcePosts = basePosts ?? postsRef.current;
    const recentPostsById = new Map<string, FeedPost>();

    postsRef.current.forEach((post) => {
      if (recentUploadIdSet.has(post.id)) {
        recentPostsById.set(post.id, post);
      }
    });
    sourcePosts.forEach((post) => {
      if (recentUploadIdSet.has(post.id)) {
        recentPostsById.set(post.id, post);
      }
    });

    const requestGeneration = firstPageGenerationRef.current;
    const missingPostIds = recentUploadIds.filter(
      (postId) => !recentPostsById.has(postId),
    );

    if (missingPostIds.length > 0) {
      const loadedPosts = await Promise.all(
        missingPostIds.map(async (postId) => {
          try {
            return await getPost(postId);
          } catch {
            return null;
          }
        }),
      );

      if (firstPageGenerationRef.current !== requestGeneration) {
        return;
      }

      loadedPosts.forEach((post) => {
        if (post?.user.id === currentUserId) {
          recentPostsById.set(post.id, post);
        }
      });
    }

    setPosts((currentPosts) => {
      currentPosts.forEach((post) => {
        if (recentUploadIdSet.has(post.id)) {
          recentPostsById.set(post.id, post);
        }
      });

      const recentPosts = recentUploadIds.reduce<FeedPost[]>(
        (result, postId) => {
          const post = recentPostsById.get(postId);

          if (post?.user.id === currentUserId) {
            result.push(post);
          }

          return result;
        },
        [],
      );

      const rankedPosts = (basePosts ?? currentPosts).filter(
        (post) =>
          post.user.id !== currentUserId &&
          !recentUploadIdSet.has(post.id),
      );

      return [...recentPosts, ...rankedPosts];
    });
  }, [currentUserId]);

  useFocusEffect(
    useCallback(() => {
      void prependRecentUploads();
    }, [prependRecentUploads]),
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
        void prependRecentUploads(cachedPage.posts);
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
      void prependRecentUploads(result.posts);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "피드를 불러오지 못했습니다.",
      );
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUserId, prependRecentUploads]);

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
      posts: posts.filter((post) => post.user.id !== currentUserId),
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
