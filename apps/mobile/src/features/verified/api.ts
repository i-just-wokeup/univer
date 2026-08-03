import { getSupabaseMobileClient } from "../../lib/supabase";

const VERIFIED_USER_IDS_CACHE_TTL_MS = 5 * 60 * 1000;

type VerifiedUserIdsCache = {
  expiresAt: number;
  userIds: string[];
};

let verifiedUserIdsCache: VerifiedUserIdsCache | null = null;
let verifiedUserIdsInFlight: Promise<string[]> | null = null;

export async function getVerifiedUserIds(): Promise<string[]> {
  const now = Date.now();

  if (verifiedUserIdsCache && verifiedUserIdsCache.expiresAt > now) {
    return verifiedUserIdsCache.userIds;
  }

  if (verifiedUserIdsInFlight) {
    return verifiedUserIdsInFlight;
  }

  const supabase = getSupabaseMobileClient();
  const promise = (async () => {
    const { data, error } = await supabase.rpc("get_verified_user_ids");

    if (error || !Array.isArray(data)) {
      throw error ?? new Error("인증 유저 목록을 불러오지 못했습니다.");
    }

    const userIds = data
      .map((row) => row.user_id)
      .filter((userId): userId is string => typeof userId === "string");

    verifiedUserIdsCache = {
      expiresAt: Date.now() + VERIFIED_USER_IDS_CACHE_TTL_MS,
      userIds,
    };

    return userIds;
  })();

  verifiedUserIdsInFlight = promise;

  try {
    return await promise;
  } catch (error) {
    verifiedUserIdsCache = null;
    throw error;
  } finally {
    if (verifiedUserIdsInFlight === promise) {
      verifiedUserIdsInFlight = null;
    }
  }
}
