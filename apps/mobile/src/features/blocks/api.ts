// 차단 데이터 계층 — 차단/해제/목록. 모두 RPC 래퍼.
import { getSupabaseMobileClient } from "../../lib/supabase";
import { clearProfilePageCache } from "../profile/page-cache";
import { invalidateBlockRelatedCache } from "../shared/userContext";

export type BlockedUser = {
  id: string;
  nickname: string;
  avatar_url: string | null;
  department: string | null;
  created_at: string;
};

// 대상 유저 차단(block_user RPC: 친구관계·상호 즐겨찾기도 함께 정리).
export async function blockUser(userId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();

  const { error } = await supabase.rpc("block_user", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error("사용자 차단에 실패했습니다.");
  }

  invalidateBlockRelatedCache();
  clearProfilePageCache();
}

// 내가 차단한 계정 목록(id/닉네임/아바타/학과/차단 시각).
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

// 차단 해제(unblock_user RPC. 친구 관계 자동 복구는 없음).
export async function unblockUser(userId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();

  const { error } = await supabase.rpc("unblock_user", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error("차단 해제에 실패했습니다.");
  }

  invalidateBlockRelatedCache();
  clearProfilePageCache();
}
