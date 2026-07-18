// 여러 도메인이 공유하는 현재 유저/차단 관계 헬퍼.
// (웹은 getCurrentUserId가 3곳에 중복돼 있었는데 앱은 여기로 일원화)
import { getSupabaseMobileClient } from "../../lib/supabase";

const BLOCK_RELATED_CACHE_TTL_MS = 30_000;

type CurrentUserContextCache = {
  universityId: string;
  userId: string;
};

type BlockRelatedUserIdsCache = {
  expiresAt: number;
  userId: string;
  userIds: string[];
};

type BlockRelatedUserIdsInFlight = {
  promise: Promise<string[]>;
  userId: string;
};

let currentUserContextCache: CurrentUserContextCache | null = null;
let blockRelatedUserIdsCache: BlockRelatedUserIdsCache | null = null;
let blockRelatedUserIdsInFlight: BlockRelatedUserIdsInFlight | null = null;
let blockRelatedCacheGeneration = 0;

export function invalidateCurrentUserContextCache(): void {
  currentUserContextCache = null;
}

export function invalidateBlockRelatedCache(): void {
  blockRelatedUserIdsCache = null;
  blockRelatedUserIdsInFlight = null;
  blockRelatedCacheGeneration += 1;
}

export function clearUserContextCaches(): void {
  invalidateCurrentUserContextCache();
  invalidateBlockRelatedCache();
}

// 현재 로그인 유저 id(없으면 에러).
export async function getCurrentUserId(): Promise<string> {
  const supabase = getSupabaseMobileClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    throw new Error("로그인이 필요합니다.");
  }

  return session.user.id;
}

// 현재 유저 id + 소속 학교 id. 피드/탐색/스토리 등 "같은 학교" 범위 쿼리에서 공용.
export async function getCurrentUserContext(): Promise<{
  universityId: string;
  userId: string;
}> {
  const supabase = getSupabaseMobileClient();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session?.user) {
    throw new Error("로그인이 필요합니다.");
  }

  const userId = session.user.id;
  if (currentUserContextCache?.userId === userId) {
    return currentUserContextCache;
  }

  const { data, error } = await supabase
    .from("users")
    .select("university_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.university_id) {
    throw new Error("현재 로그인 유저의 학교 정보를 찾을 수 없습니다.");
  }

  currentUserContextCache = {
    universityId: data.university_id,
    userId,
  };

  return currentUserContextCache;
}

// 나와 차단 관계(내가 차단 + 나를 차단)인 유저 id 모두(get_block_related_user_ids RPC). 실패 시 빈 배열.
export async function getBlockRelatedUserIds(): Promise<string[]> {
  const supabase = getSupabaseMobileClient();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session?.user) {
    return [];
  }

  const userId = session.user.id;
  const now = Date.now();

  if (
    blockRelatedUserIdsCache?.userId === userId &&
    blockRelatedUserIdsCache.expiresAt > now
  ) {
    return blockRelatedUserIdsCache.userIds;
  }

  if (blockRelatedUserIdsInFlight?.userId === userId) {
    return blockRelatedUserIdsInFlight.promise;
  }

  const requestGeneration = blockRelatedCacheGeneration;
  const promise = (async () => {
    const { data, error } = await supabase.rpc("get_block_related_user_ids");

    if (error || !Array.isArray(data)) {
      return [];
    }

    const userIds = data
      .map((row) => row.user_id)
      .filter((blockedUserId): blockedUserId is string => typeof blockedUserId === "string");

    if (blockRelatedCacheGeneration === requestGeneration) {
      blockRelatedUserIdsCache = {
        expiresAt: Date.now() + BLOCK_RELATED_CACHE_TTL_MS,
        userId,
        userIds,
      };
    }

    return userIds;
  })();

  blockRelatedUserIdsInFlight = {
    promise,
    userId,
  };

  try {
    return await promise;
  } finally {
    if (blockRelatedUserIdsInFlight?.promise === promise) {
      blockRelatedUserIdsInFlight = null;
    }
  }
}

// 특정 유저가 나와 차단 관계인지 여부.
export async function isBlockRelatedUser(userId: string): Promise<boolean> {
  const blockRelatedUserIds = await getBlockRelatedUserIds();
  return blockRelatedUserIds.includes(userId);
}
