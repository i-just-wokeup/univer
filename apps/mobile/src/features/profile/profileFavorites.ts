import { getSupabaseMobileClient } from "../../lib/supabase";
import { getCurrentUserId } from "../shared/userContext";

export async function getFavoriteUserStatus(userId: string): Promise<boolean> {
  const supabase = getSupabaseMobileClient();
  const currentUserId = await getCurrentUserId();

  if (currentUserId === userId) {
    return false;
  }

  const { data, error } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", currentUserId)
    .eq("favorite_user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("즐겨찾기 상태를 불러오지 못했습니다.");
  }

  return Boolean(data);
}

// 즐겨찾기 추가/해제 토글. 추가 전에는 같은 학교의 미삭제 유저인지 한 번 더 확인한다.
export async function toggleUserFavorite(
  favoriteUserId: string,
): Promise<{ favorited: boolean }> {
  const supabase = getSupabaseMobileClient();
  const currentUserId = await getCurrentUserId();

  if (currentUserId === favoriteUserId) {
    throw new Error("내 계정은 즐겨찾기에 추가할 수 없습니다.");
  }

  const { data: currentUser, error: currentUserError } = await supabase
    .from("users")
    .select("university_id")
    .eq("id", currentUserId)
    .maybeSingle();

  if (currentUserError || !currentUser?.university_id) {
    throw new Error("사용자 정보를 불러오지 못했습니다.");
  }

  const { data: existingFavorite, error: selectError } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", currentUserId)
    .eq("favorite_user_id", favoriteUserId)
    .maybeSingle();

  if (selectError) {
    throw new Error("즐겨찾기 상태를 확인하지 못했습니다.");
  }

  if (existingFavorite) {
    const { error: deleteError } = await supabase
      .from("user_favorites")
      .delete()
      .eq("id", existingFavorite.id)
      .eq("user_id", currentUserId);

    if (deleteError) {
      throw new Error("즐겨찾기 해제에 실패했습니다.");
    }

    return { favorited: false };
  }

  const { data: targetUser, error: targetError } = await supabase
    .from("users")
    .select("id")
    .eq("id", favoriteUserId)
    .eq("university_id", currentUser.university_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (targetError || !targetUser) {
    throw new Error("즐겨찾기에 추가할 수 없는 계정입니다.");
  }

  const { error: insertError } = await supabase.from("user_favorites").insert({
    favorite_user_id: favoriteUserId,
    user_id: currentUserId,
  });

  if (insertError) {
    throw new Error("즐겨찾기 추가에 실패했습니다.");
  }

  return { favorited: true };
}
