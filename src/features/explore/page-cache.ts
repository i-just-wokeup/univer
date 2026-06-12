import type { ExplorePost } from "@/features/explore/api";

const EXPLORE_PAGE_CACHE_TTL_MS = 90_000;

export type ExplorePageCacheValue = {
  cachedAt: number;
  hasMore: boolean;
  offset: number;
  posts: ExplorePost[];
};

let explorePageCache: ExplorePageCacheValue | null = null;

export function getExplorePageCache() {
  if (!explorePageCache) {
    return null;
  }

  if (Date.now() - explorePageCache.cachedAt > EXPLORE_PAGE_CACHE_TTL_MS) {
    explorePageCache = null;
    return null;
  }

  return explorePageCache;
}

export function setExplorePageCache(
  value: Omit<ExplorePageCacheValue, "cachedAt">,
) {
  explorePageCache = {
    ...value,
    cachedAt: Date.now(),
  };
}
