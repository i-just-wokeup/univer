import { getSupabaseMobileClient } from "../../lib/supabase";
import { getCurrentUserId } from "../shared/userContext";

// 팔로우는 기관(official_accounts)·승격 계정만 대상으로 하는 단방향 관계다.
// 일반 학생 사이의 관계는 크루(user_connections)가 담당하며 서로 영향을 주지 않는다.
// 대상 제한은 follows_insert RLS가 서버에서 강제하므로, 여기서는 UI 흐름만 다룬다.

export async function getFollowState(targetUserId: string): Promise<boolean> {
  const supabase = getSupabaseMobileClient();
  const currentUserId = await getCurrentUserId();

  if (currentUserId === targetUserId) {
    return false;
  }

  const { data, error } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", currentUserId)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (error) {
    throw new Error("팔로우 상태를 불러오지 못했습니다.");
  }

  return Boolean(data);
}

export async function getFollowerCount(targetUserId: string): Promise<number> {
  const supabase = getSupabaseMobileClient();

  const { count, error } = await supabase
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("following_id", targetUserId);

  if (error) {
    throw new Error("팔로워 수를 불러오지 못했습니다.");
  }

  return count ?? 0;
}

// 팔로우 추가/해제 토글. 대상 자격 검증은 RLS가 하므로 INSERT 실패를 자격 문제로 안내한다.
export async function toggleFollow(
  targetUserId: string,
): Promise<{ following: boolean }> {
  const supabase = getSupabaseMobileClient();
  const currentUserId = await getCurrentUserId();

  if (currentUserId === targetUserId) {
    throw new Error("내 계정은 팔로우할 수 없습니다.");
  }

  const { data: existing, error: selectError } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", currentUserId)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (selectError) {
    throw new Error("팔로우 상태를 확인하지 못했습니다.");
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from("follows")
      .delete()
      .eq("id", existing.id)
      .eq("follower_id", currentUserId);

    if (deleteError) {
      throw new Error("팔로우 해제에 실패했습니다.");
    }

    return { following: false };
  }

  const { error: insertError } = await supabase.from("follows").insert({
    follower_id: currentUserId,
    following_id: targetUserId,
  });

  if (insertError) {
    throw new Error("팔로우할 수 없는 계정입니다.");
  }

  return { following: true };
}
