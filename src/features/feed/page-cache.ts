import type { FeedPost } from "@/features/feed/api";

const FEED_PAGE_CACHE_TTL_MS = 90_000;

export type FeedPageCacheValue = {
  bookmarkedPostIds: string[];
  cachedAt: number;
  likedPostIds: string[];
  nextCursor: string | null;
  posts: FeedPost[];
};

let feedPageCache: FeedPageCacheValue | null = null;

export function getFeedPageCache() {
  if (!feedPageCache) {
    return null;
  }

  if (Date.now() - feedPageCache.cachedAt > FEED_PAGE_CACHE_TTL_MS) {
    feedPageCache = null;
    return null;
  }

  return feedPageCache;
}

export function setFeedPageCache(
  value: Omit<FeedPageCacheValue, "cachedAt">,
) {
  feedPageCache = {
    ...value,
    cachedAt: Date.now(),
  };
}
