import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

function requireSupabaseClient() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  return supabase;
}

export async function blockUser(userId: string): Promise<void> {
  const supabase = requireSupabaseClient();

  const { error } = await supabase.rpc("block_user", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error("사용자 차단에 실패했습니다.");
  }
}

export async function getBlockRelatedUserIds(): Promise<string[]> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase.rpc("get_block_related_user_ids");

  if (error || !Array.isArray(data)) {
    throw new Error("차단 관계를 불러오지 못했습니다.");
  }

  return data
    .map((row) => row.user_id)
    .filter((userId): userId is string => typeof userId === "string");
}

export async function isBlockRelatedUser(userId: string): Promise<boolean> {
  const blockRelatedUserIds = await getBlockRelatedUserIds();

  return blockRelatedUserIds.includes(userId);
}

export type BlockedUser = {
  id: string;
  nickname: string;
  avatar_url: string | null;
  department: string;
  created_at: string;
};

export async function getBlockedUsers(): Promise<BlockedUser[]> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase.rpc("get_blocked_users");

  if (error || !Array.isArray(data)) {
    throw new Error("차단 목록을 불러오지 못했습니다.");
  }

  return data.map((row) => ({
    avatar_url: row.avatar_url,
    created_at: row.created_at,
    department: row.department,
    id: row.id,
    nickname: row.nickname,
  }));
}

export async function unblockUser(userId: string): Promise<void> {
  const supabase = requireSupabaseClient();

  const { error } = await supabase.rpc("unblock_user", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error("차단 해제에 실패했습니다.");
  }
}
