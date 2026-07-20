import type { ExplorePost } from "./types";

const EXPLORE_PAGE_CACHE_TTL_MS = 300_000;

export type ExplorePageCacheSnapshot = {
  cachedAt: number;
  hasMore: boolean;
  offset: number;
  posts: ExplorePost[];
};

type ExplorePageCacheEntry = ExplorePageCacheSnapshot & {
  userId: string;
};

type SetExplorePageCacheParams = {
  hasMore: boolean;
  offset: number;
  posts: ExplorePost[];
  userId: string;
};

let explorePageCache: ExplorePageCacheEntry | null = null;

function isFreshCache(entry: ExplorePageCacheEntry, userId: string) {
  return entry.userId === userId && Date.now() - entry.cachedAt < EXPLORE_PAGE_CACHE_TTL_MS;
}

export function getExplorePageCache(userId: string): ExplorePageCacheSnapshot | null {
  if (!explorePageCache) {
    return null;
  }

  if (!isFreshCache(explorePageCache, userId)) {
    explorePageCache = null;
    return null;
  }

  const { userId: _userId, ...snapshot } = explorePageCache;
  return snapshot;
}

export function setExplorePageCache(params: SetExplorePageCacheParams) {
  explorePageCache = {
    cachedAt: Date.now(),
    hasMore: params.hasMore,
    offset: params.offset,
    posts: params.posts,
    userId: params.userId,
  };
}

export function clearExplorePageCache() {
  explorePageCache = null;
}
