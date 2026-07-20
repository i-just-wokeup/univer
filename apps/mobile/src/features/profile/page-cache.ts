import type {
  ConnectionStatus,
  ProfileCounts,
  ProfileDetail,
  ProfileGridPost,
} from "./types";

const PROFILE_PAGE_CACHE_TTL_MS = 300_000;
const MY_PROFILE_CACHE_KEY = "__me__";

export type ProfilePageCacheSnapshot = {
  cachedAt: number;
  connectionStatus: ConnectionStatus | null;
  counts: ProfileCounts;
  currentUserId: string;
  isFavorite: boolean;
  isMine: boolean;
  posts: ProfileGridPost[];
  profile: ProfileDetail;
};

type ProfilePageCacheEntry = ProfilePageCacheSnapshot;

type GetProfilePageCacheParams = {
  currentUserId: string;
  nickname?: string;
};

type SetProfilePageCacheParams = Omit<ProfilePageCacheSnapshot, "cachedAt"> & {
  nickname?: string;
};

const profilePageCache = new Map<string, ProfilePageCacheEntry>();

function getProfileCacheKey(nickname?: string) {
  return nickname ? nickname.trim().toLowerCase() : MY_PROFILE_CACHE_KEY;
}

function isFreshCache(entry: ProfilePageCacheEntry, currentUserId: string) {
  return (
    entry.currentUserId === currentUserId &&
    Date.now() - entry.cachedAt < PROFILE_PAGE_CACHE_TTL_MS
  );
}

export function getProfilePageCache({
  currentUserId,
  nickname,
}: GetProfilePageCacheParams): ProfilePageCacheSnapshot | null {
  const cacheKey = getProfileCacheKey(nickname);
  const cached = profilePageCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  if (!isFreshCache(cached, currentUserId)) {
    profilePageCache.delete(cacheKey);
    return null;
  }

  return cached;
}

export function setProfilePageCache(params: SetProfilePageCacheParams) {
  const cacheKey = getProfileCacheKey(params.nickname);
  profilePageCache.set(cacheKey, {
    cachedAt: Date.now(),
    connectionStatus: params.connectionStatus,
    counts: params.counts,
    currentUserId: params.currentUserId,
    isFavorite: params.isFavorite,
    isMine: params.isMine,
    posts: params.posts,
    profile: params.profile,
  });
}

export function invalidateProfilePageCacheForUser(userId: string) {
  for (const [cacheKey, cached] of profilePageCache.entries()) {
    if (cached.profile.id === userId) {
      profilePageCache.delete(cacheKey);
    }
  }
}

export function clearProfilePageCache() {
  profilePageCache.clear();
}
