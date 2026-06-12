import type {
  ConnectionStatus,
  Profile,
  ProfilePost,
} from "@/features/profile/api";

const PROFILE_PAGE_CACHE_TTL_MS = 60_000;

export type ProfilePageCacheValue = {
  cachedAt: number;
  connectionStatus: ConnectionStatus;
  currentUserId: string | null;
  isFavorite: boolean;
  posts: ProfilePost[];
  postsCount: number;
  profile: Profile;
};

const profilePageCacheByNickname = new Map<string, ProfilePageCacheValue>();

function normalizeNicknameKey(nickname: string) {
  return nickname.trim().toLowerCase();
}

export function getProfilePageCache(nickname: string) {
  const key = normalizeNicknameKey(nickname);
  const cachedValue = profilePageCacheByNickname.get(key);

  if (!cachedValue) {
    return null;
  }

  if (Date.now() - cachedValue.cachedAt > PROFILE_PAGE_CACHE_TTL_MS) {
    profilePageCacheByNickname.delete(key);
    return null;
  }

  return cachedValue;
}

export function setProfilePageCache(
  nickname: string,
  value: Omit<ProfilePageCacheValue, "cachedAt">,
) {
  profilePageCacheByNickname.set(normalizeNicknameKey(nickname), {
    ...value,
    cachedAt: Date.now(),
  });
}
