import type { FeedPost, FeedPostRank, FeedRankCursor } from "./types";

// 재진입 즉시표시 유지 시간. 캐시는 먼저 보여주고 네트워크에서 최신 피드를 다시 확인한다.
const FEED_PAGE_CACHE_TTL_MS = 300_000;

export type FeedPageCacheSnapshot = {
  bookmarkedPostIds: string[];
  cachedAt: number;
  likedPostIds: string[];
  nextCursor: FeedRankCursor | null;
  postRanks: Map<string, FeedPostRank>;
  posts: FeedPost[];
  seed: number;
};

type FeedPageCacheEntry = FeedPageCacheSnapshot & {
  userId: string;
};

type SetFeedPageCacheParams = {
  bookmarkedPostIds: Iterable<string>;
  cachedAt: number;
  likedPostIds: Iterable<string>;
  nextCursor: FeedRankCursor | null;
  postRanks: Map<string, FeedPostRank>;
  posts: FeedPost[];
  seed: number;
  userId: string;
};

let feedPageCache: FeedPageCacheEntry | null = null;

function isFreshCache(entry: FeedPageCacheEntry, userId: string) {
  return (
    entry.userId === userId &&
    Date.now() - entry.cachedAt <= FEED_PAGE_CACHE_TTL_MS
  );
}

function toSnapshot(entry: FeedPageCacheEntry): FeedPageCacheSnapshot {
  return {
    bookmarkedPostIds: [...entry.bookmarkedPostIds],
    cachedAt: entry.cachedAt,
    likedPostIds: [...entry.likedPostIds],
    nextCursor: entry.nextCursor,
    postRanks: new Map(entry.postRanks),
    posts: entry.posts,
    seed: entry.seed,
  };
}

// 메모리 캐시라 앱 프로세스가 살아있는 동안만 유지된다. userId guard는 계정 전환 누출 방지용.
export function getFeedPageCache(
  userId: string,
): FeedPageCacheSnapshot | null {
  if (!feedPageCache) {
    return null;
  }

  if (!isFreshCache(feedPageCache, userId)) {
    feedPageCache = null;
    return null;
  }

  return toSnapshot(feedPageCache);
}

export function setFeedPageCache(params: SetFeedPageCacheParams) {
  feedPageCache = {
    bookmarkedPostIds: [...params.bookmarkedPostIds],
    // 좋아요·카운트 같은 로컬 상태 저장으로 마지막 피드 조회 시각을 연장하지 않는다.
    cachedAt: params.cachedAt,
    likedPostIds: [...params.likedPostIds],
    nextCursor: params.nextCursor,
    postRanks: new Map(params.postRanks),
    posts: params.posts,
    seed: params.seed,
    userId: params.userId,
  };
}

export function clearFeedPageCache() {
  feedPageCache = null;
}
