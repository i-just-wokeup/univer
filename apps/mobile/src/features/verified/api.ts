import { getSupabaseMobileClient } from "../../lib/supabase";

const ACCOUNT_BADGES_CACHE_TTL_MS = 5 * 60 * 1000;

// 계정 배지: 소속(학생회/동아리) + 승격 여부. 크루는 표시하지 않는다.
export type AccountAffiliation = "council" | "club";

export type AccountBadge = {
  affiliation: AccountAffiliation | null;
  promoted: boolean;
  userId: string;
};

type AccountBadgesCache = {
  badges: AccountBadge[];
  expiresAt: number;
};

let accountBadgesCache: AccountBadgesCache | null = null;
let accountBadgesInFlight: Promise<AccountBadge[]> | null = null;

function toAffiliation(value: unknown): AccountAffiliation | null {
  return value === "council" || value === "club" ? value : null;
}

export async function getAccountBadges(): Promise<AccountBadge[]> {
  const now = Date.now();

  if (accountBadgesCache && accountBadgesCache.expiresAt > now) {
    return accountBadgesCache.badges;
  }

  if (accountBadgesInFlight) {
    return accountBadgesInFlight;
  }

  const supabase = getSupabaseMobileClient();
  const promise = (async () => {
    const { data, error } = await supabase.rpc("get_account_badges");

    if (error || !Array.isArray(data)) {
      throw error ?? new Error("계정 배지 목록을 불러오지 못했습니다.");
    }

    const badges = data
      .filter((row) => typeof row.user_id === "string")
      .map(
        (row): AccountBadge => ({
          affiliation: toAffiliation(row.affiliation),
          promoted: row.promoted === true,
          userId: row.user_id as string,
        }),
      );

    accountBadgesCache = {
      badges,
      expiresAt: Date.now() + ACCOUNT_BADGES_CACHE_TTL_MS,
    };

    return badges;
  })();

  accountBadgesInFlight = promise;

  try {
    return await promise;
  } catch (error) {
    accountBadgesCache = null;
    throw error;
  } finally {
    if (accountBadgesInFlight === promise) {
      accountBadgesInFlight = null;
    }
  }
}
