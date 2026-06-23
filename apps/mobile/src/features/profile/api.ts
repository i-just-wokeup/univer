import type { Database } from "../../types/database.types";
import type { Json } from "../../types/database.types";
import { getSupabaseMobileClient } from "../../lib/supabase";
import type {
  ConnectionStatus,
  ConnectionUser,
  ProfileCounts,
  ProfileDetail,
  ProfileGridPost,
  ProfileLink,
} from "./types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];
type ProfileLinkRow = Database["public"]["Tables"]["profile_links"]["Row"];

function isConnectionStatus(value: Json | null): value is ConnectionStatus {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return (
    "status" in value &&
    typeof value.status === "string" &&
    (value.status === "none" ||
      value.status === "pending" ||
      value.status === "accepted" ||
      value.status === "rejected") &&
    "is_requester" in value &&
    typeof value.is_requester === "boolean" &&
    "friends_count" in value &&
    typeof value.friends_count === "number"
  );
}

function normalizeConnectionUsers(users: ConnectionUser[]): ConnectionUser[] {
  return users.map(({ avatar_url, department, id, nickname }) => ({
    avatar_url,
    department,
    id,
    nickname,
  }));
}

async function getCurrentUserId(): Promise<string> {
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

async function getBlockRelatedUserIds(): Promise<string[]> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_block_related_user_ids");

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data
    .map((row) => row.user_id)
    .filter((userId): userId is string => typeof userId === "string");
}

// 실명은 본인이거나 크루(accepted)일 때만 RPC가 값을 반환한다.
async function getRealName(userId: string): Promise<string | null> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_user_real_name", {
    p_user_id: userId,
  });

  if (error || typeof data !== "string") {
    return null;
  }

  return data;
}

async function getProfileLinks(userId: string): Promise<ProfileLink[]> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase
    .from("profile_links")
    .select("id, label, url, order_index")
    .eq("user_id", userId)
    .order("order_index", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as Pick<ProfileLinkRow, "id" | "label" | "order_index" | "url">[]).map(
    (link) => ({ id: link.id, label: link.label, url: link.url }),
  );
}

// 닉네임이 없으면 현재 로그인 유저, 있으면 해당 닉네임 프로필을 조회한다.
export async function getProfile(
  nickname?: string,
): Promise<{ isMine: boolean; profile: ProfileDetail }> {
  const supabase = getSupabaseMobileClient();
  const currentUserId = await getCurrentUserId();

  let query = supabase
    .from("users")
    .select("id, nickname, bio, avatar_url, department");

  query = nickname
    ? query.eq("nickname", nickname)
    : query.eq("id", currentUserId);

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    throw new Error("프로필을 찾을 수 없습니다.");
  }

  const profileRow = data as Pick<
    UserRow,
    "avatar_url" | "bio" | "department" | "id" | "nickname"
  >;
  const isMine = profileRow.id === currentUserId;

  if (!isMine) {
    const blockRelatedUserIds = await getBlockRelatedUserIds();

    if (blockRelatedUserIds.includes(profileRow.id)) {
      throw new Error("차단 관계인 프로필은 볼 수 없습니다.");
    }
  }

  const [realName, links] = await Promise.all([
    getRealName(profileRow.id),
    getProfileLinks(profileRow.id),
  ]);

  return {
    isMine,
    profile: {
      avatar_url: profileRow.avatar_url,
      bio: profileRow.bio,
      department: profileRow.department,
      id: profileRow.id,
      links,
      nickname: profileRow.nickname,
      real_name: realName,
    },
  };
}

export async function getProfilePosts(
  userId: string,
): Promise<ProfileGridPost[]> {
  const supabase = getSupabaseMobileClient();

  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select("id, created_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (postsError || !postsData) {
    throw new Error("프로필 게시물을 불러오지 못했습니다.");
  }

  if (postsData.length === 0) {
    return [];
  }

  const postIds = postsData.map((post) => post.id);

  const { data: imagesData, error: imagesError } = await supabase
    .from("post_media")
    .select("post_id, url, order_index")
    .in("post_id", postIds)
    .eq("type", "image")
    .eq("order_index", 0);

  if (imagesError || !imagesData) {
    throw new Error("게시물 이미지를 불러오지 못했습니다.");
  }

  const imageByPostId = new Map<string, string>();

  (imagesData as Pick<PostMediaRow, "order_index" | "post_id" | "url">[]).forEach(
    (image) => {
      if (!imageByPostId.has(image.post_id)) {
        imageByPostId.set(image.post_id, image.url);
      }
    },
  );

  return (postsData as Pick<PostRow, "created_at" | "id">[]).map((post) => ({
    id: post.id,
    image_url: imageByPostId.get(post.id) ?? null,
  }));
}

export async function getProfileCounts(userId: string): Promise<ProfileCounts> {
  const supabase = getSupabaseMobileClient();

  const { count, error: countError } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (countError) {
    throw new Error("게시물 수를 불러오지 못했습니다.");
  }

  const connectionStatus = await getConnectionStatus(userId);

  return { crew: connectionStatus.friends_count, posts: count ?? 0 };
}

export async function getConnectionStatus(
  userId: string,
): Promise<ConnectionStatus> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_connection_status", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error("친구 연결 상태를 불러오지 못했습니다.");
  }

  const normalizedData = (data ?? null) as Json | null;

  if (!isConnectionStatus(normalizedData)) {
    throw new Error("친구 연결 상태 응답 형식이 올바르지 않습니다.");
  }

  return normalizedData;
}

export async function sendFriendRequest(userId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const { error } = await supabase.rpc("send_friend_request", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error("친구 신청에 실패했습니다.");
  }
}

export async function acceptFriendRequest(userId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const { error } = await supabase.rpc("accept_friend_request", {
    requester_user_id: userId,
  });

  if (error) {
    throw new Error("친구 요청 수락에 실패했습니다.");
  }
}

export async function rejectFriendRequest(userId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const { error } = await supabase.rpc("reject_friend_request", {
    requester_user_id: userId,
  });

  if (error) {
    throw new Error("친구 요청 거절에 실패했습니다.");
  }
}

export async function removeFriend(userId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const { error } = await supabase.rpc("remove_friend", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error("친구 연결 해제에 실패했습니다.");
  }
}

export async function getFriends(): Promise<ConnectionUser[]> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_friends");

  if (error || !data) {
    throw new Error("크루 목록을 불러오지 못했습니다.");
  }

  return normalizeConnectionUsers(data);
}

export async function getPendingRequests(): Promise<ConnectionUser[]> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_pending_requests");

  if (error || !data) {
    throw new Error("받은 요청 목록을 불러오지 못했습니다.");
  }

  return normalizeConnectionUsers(data);
}

export async function getSentRequests(): Promise<ConnectionUser[]> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_sent_requests");

  if (error || !data) {
    throw new Error("보낸 요청 목록을 불러오지 못했습니다.");
  }

  return normalizeConnectionUsers(data);
}

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
