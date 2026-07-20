import type { FeedPost } from "./types";

// 재진입 즉시표시 유지 시간. 잠깐 다른 앱 보고 와도 즉시 뜨도록 5분.
// (더 길면 새 글이 늦게 보이고, 짧으면 재진입마다 로딩. 당겨서 새로고침으로 언제든 갱신 가능)
const FEED_PAGE_CACHE_TTL_MS = 300_000;

export type FeedPageCacheSnapshot = {
  bookmarkedPostIds: string[];
  cachedAt: number;
  likedPostIds: string[];
  nextCursor: string | null;
  posts: FeedPost[];
};

type FeedPageCacheEntry = FeedPageCacheSnapshot & {
  userId: string;
};

type SetFeedPageCacheParams = {
  bookmarkedPostIds: Iterable<string>;
  likedPostIds: Iterable<string>;
  nextCursor: string | null;
  posts: FeedPost[];
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
    posts: entry.posts,
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

export function hasFreshFeedPageCache(userId: string) {
  return getFeedPageCache(userId) !== null;
}

export function setFeedPageCache(params: SetFeedPageCacheParams) {
  feedPageCache = {
    bookmarkedPostIds: [...params.bookmarkedPostIds],
    cachedAt: Date.now(),
    likedPostIds: [...params.likedPostIds],
    nextCursor: params.nextCursor,
    posts: params.posts,
    userId: params.userId,
  };
}

export function clearFeedPageCache() {
  feedPageCache = null;
}
