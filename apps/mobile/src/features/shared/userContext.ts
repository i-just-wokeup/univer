import { getSupabaseMobileClient } from "../../lib/supabase";

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
