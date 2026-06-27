import { getSupabaseMobileClient } from "../../lib/supabase";

export type BlockedUser = {
  id: string;
  nickname: string;
  avatar_url: string | null;
  department: string;
  created_at: string;
};

export async function blockUser(userId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();

  const { error } = await supabase.rpc("block_user", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error("사용자 차단에 실패했습니다.");
  }
}

export async function getBlockedUsers(): Promise<BlockedUser[]> {
  const supabase = getSupabaseMobileClient();

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
  const supabase = getSupabaseMobileClient();

  const { error } = await supabase.rpc("unblock_user", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error("차단 해제에 실패했습니다.");
  }
}
