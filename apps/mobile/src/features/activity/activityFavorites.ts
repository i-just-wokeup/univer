import { getSupabaseMobileClient } from "../../lib/supabase";
import { getCurrentUserContext } from "../shared/userContext";
import type {
  ActivityFavoriteUser,
  UserFavoriteRow,
} from "./activityTypes";

// 즐겨찾기한 계정 목록(같은 학교·미삭제만, 즐겨찾기 시각 순).
export async function getFavoriteUsers(): Promise<ActivityFavoriteUser[]> {
  const supabase = getSupabaseMobileClient();
  const { universityId, userId } = await getCurrentUserContext();

  const { data: favorites, error } = await supabase
    .from("user_favorites")
    .select("favorite_user_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !favorites) {
    throw new Error("즐겨찾기 계정을 불러오지 못했습니다.");
  }

  if (favorites.length === 0) {
    return [];
  }

  const favoriteUserIds = favorites.map(
    (favorite: Pick<UserFavoriteRow, "favorite_user_id">) =>
      favorite.favorite_user_id,
  );
  const favoritedAtByUserId = new Map(
    favorites.map(
      (favorite: Pick<UserFavoriteRow, "created_at" | "favorite_user_id">) => [
        favorite.favorite_user_id,
        favorite.created_at,
      ],
    ),
  );

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, nickname, department, avatar_url")
    .eq("university_id", universityId)
    .is("deleted_at", null)
    .in("id", favoriteUserIds);

  if (usersError || !users) {
    throw new Error("즐겨찾기 계정 정보를 불러오지 못했습니다.");
  }

  const usersById = new Map(users.map((user) => [user.id, user]));

  return favoriteUserIds.reduce<ActivityFavoriteUser[]>((items, userId) => {
    const user = usersById.get(userId);
    const favoritedAt = favoritedAtByUserId.get(userId);

    if (!user || !favoritedAt) {
      return items;
    }

    items.push({
      avatar_url: user.avatar_url,
      department: user.department,
      favorited_at: favoritedAt,
      id: user.id,
      nickname: user.nickname,
    });

    return items;
  }, []);
}
