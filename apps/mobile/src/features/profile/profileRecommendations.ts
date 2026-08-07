import { getSupabaseMobileClient } from "../../lib/supabase";
import type { FriendRecommendation } from "./types";

export async function getFriendRecommendations(): Promise<FriendRecommendation[]> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_friend_recommendations", {
    p_limit: 20,
  });

  if (error || !data) {
    throw new Error("추천 크루를 불러오지 못했습니다.");
  }

  return data.map((row) => ({
    avatarUrl: row.avatar_url,
    mutualCount: row.mutual_count,
    nickname: row.nickname,
    sameDept: row.same_dept,
    userId: row.user_id,
  }));
}
