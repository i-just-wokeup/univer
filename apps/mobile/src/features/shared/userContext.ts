// 여러 도메인이 공유하는 현재 유저/차단 관계 헬퍼.
// (웹은 getCurrentUserId가 3곳에 중복돼 있었는데 앱은 여기로 일원화)
import { getSupabaseMobileClient } from "../../lib/supabase";

// 현재 로그인 유저 id(없으면 에러).
export async function getCurrentUserId(): Promise<string> {
  const supabase = getSupabaseMobileClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  return user.id;
}

// 현재 유저 id + 소속 학교 id. 피드/탐색/스토리 등 "같은 학교" 범위 쿼리에서 공용.
export async function getCurrentUserContext(): Promise<{
  universityId: string;
  userId: string;
}> {
  const supabase = getSupabaseMobileClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("users")
    .select("university_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data?.university_id) {
    throw new Error("현재 로그인 유저의 학교 정보를 찾을 수 없습니다.");
  }

  return {
    universityId: data.university_id,
    userId: user.id,
  };
}

// 나와 차단 관계(내가 차단 + 나를 차단)인 유저 id 모두(get_block_related_user_ids RPC). 실패 시 빈 배열.
export async function getBlockRelatedUserIds(): Promise<string[]> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_block_related_user_ids");

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data
    .map((row) => row.user_id)
    .filter((userId): userId is string => typeof userId === "string");
}

// 특정 유저가 나와 차단 관계인지 여부.
export async function isBlockRelatedUser(userId: string): Promise<boolean> {
  const blockRelatedUserIds = await getBlockRelatedUserIds();
  return blockRelatedUserIds.includes(userId);
}
