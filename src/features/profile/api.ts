import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isBlockRelatedUser } from "@/features/blocks/api";
import type { Json } from "@/types/database.types";
import type { Database } from "@/types/database.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];
type ProfileLinkRow = Database["public"]["Tables"]["profile_links"]["Row"];

export type ProfileLink = Pick<
  ProfileLinkRow,
  "id" | "label" | "order_index" | "url"
>;

export type Profile = Pick<
  UserRow,
  | "avatar_url"
  | "bio"
  | "created_at"
  | "department"
  | "id"
  | "nickname"
  | "real_name"
  | "university_id"
> & {
  profile_links: ProfileLink[];
};

export type ProfilePostImage = Pick<PostMediaRow, "order_index" | "url">;

export type ProfilePost = Pick<
  PostRow,
  "comments_count" | "created_at" | "id" | "likes_count"
> & {
  images: ProfilePostImage[];
};

type ProfilePostImageRow = Pick<
  PostMediaRow,
  "order_index" | "post_id" | "url"
>;

export type ConnectionStatus = {
  friends_count: number;
  is_requester: boolean;
  status: "none" | "pending" | "accepted" | "rejected";
};

export type ConnectionUser = {
  id: string;
  nickname: string;
  avatar_url: string | null;
  department: string | null; // 학과 비공개 시 서버(get_friends/pending/sent)가 null 반환
};

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

function requireSupabaseClient() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  return supabase;
}

export async function getProfile(nickname: string): Promise<Profile> {
  const supabase = requireSupabaseClient();
  const trimmedNickname = nickname.trim();

  if (!trimmedNickname) {
    throw new Error("프로필 닉네임이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, nickname, bio, avatar_url, department, university_id, created_at",
    )
    .eq("nickname", trimmedNickname)
    .maybeSingle();

  if (error || !data) {
    throw new Error("프로필을 찾을 수 없습니다.");
  }

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  const profileUserId = data.id;

  if (viewer && viewer.id !== profileUserId) {
    const isBlocked = await isBlockRelatedUser(profileUserId);

    if (isBlocked) {
      throw new Error("차단 관계인 프로필은 볼 수 없습니다.");
    }
  }

  const { data: realName, error: realNameError } = await supabase.rpc(
    "get_user_real_name",
    { p_user_id: profileUserId },
  );

  if (realNameError) {
    throw new Error("실명 정보를 불러오지 못했습니다.");
  }

  const profileLinks = await getProfileLinks(profileUserId);

  return {
    ...data,
    profile_links: profileLinks,
    real_name: realName ?? null,
  } satisfies Profile;
}

export async function getProfileLinks(userId: string): Promise<ProfileLink[]> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase
    .from("profile_links")
    .select("id, label, order_index, url")
    .eq("user_id", userId)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getProfilePosts(userId: string): Promise<ProfilePost[]> {
  const supabase = requireSupabaseClient();

  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select("id, created_at, likes_count, comments_count")
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
    .eq("order_index", 0)
    .order("order_index", { ascending: true });

  if (imagesError || !imagesData) {
    throw new Error("프로필 게시물 이미지를 불러오지 못했습니다.");
  }

  const imagesByPostId = new Map<string, ProfilePostImage[]>();

  imagesData.forEach((image: ProfilePostImageRow) => {
    const currentImages = imagesByPostId.get(image.post_id) ?? [];
    currentImages.push({
      order_index: image.order_index,
      url: image.url,
    });
    imagesByPostId.set(image.post_id, currentImages);
  });

  return postsData.map((post: Pick<
    PostRow,
    "comments_count" | "created_at" | "id" | "likes_count"
  >) => ({
    comments_count: post.comments_count,
    created_at: post.created_at,
    id: post.id,
    images: imagesByPostId.get(post.id) ?? [],
    likes_count: post.likes_count,
  }));
}

export async function getPostsCount(userId: string): Promise<number> {
  const supabase = requireSupabaseClient();

  const { count, error } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    throw new Error("프로필 게시물 수를 불러오지 못했습니다.");
  }

  return count ?? 0;
}

export async function sendFriendRequest(userId: string): Promise<void> {
  const supabase = requireSupabaseClient();

  const { error } = await supabase.rpc("send_friend_request", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error("친구 신청에 실패했습니다.");
  }
}

export async function acceptFriendRequest(userId: string): Promise<void> {
  const supabase = requireSupabaseClient();

  const { error } = await supabase.rpc("accept_friend_request", {
    requester_user_id: userId,
  });

  if (error) {
    throw new Error("친구 요청 수락에 실패했습니다.");
  }
}

export async function rejectFriendRequest(userId: string): Promise<void> {
  const supabase = requireSupabaseClient();

  const { error } = await supabase.rpc("reject_friend_request", {
    requester_user_id: userId,
  });

  if (error) {
    throw new Error("친구 요청 거절에 실패했습니다.");
  }
}

export async function removeFriend(userId: string): Promise<void> {
  const supabase = requireSupabaseClient();

  const { error } = await supabase.rpc("remove_friend", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error("친구 연결 해제에 실패했습니다.");
  }
}

export async function getConnectionStatus(
  userId: string,
): Promise<ConnectionStatus> {
  const supabase = requireSupabaseClient();

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

export async function getFriends(): Promise<ConnectionUser[]> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc("get_friends");

  if (error || !data) {
    throw new Error("크루 목록을 불러오지 못했습니다.");
  }

  return data.map(({ avatar_url, department, id, nickname }) => ({
    avatar_url,
    department,
    id,
    nickname,
  }));
}

export async function getPendingRequests(): Promise<ConnectionUser[]> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc("get_pending_requests");

  if (error || !data) {
    throw new Error("받은 요청 목록을 불러오지 못했습니다.");
  }

  return data.map(({ avatar_url, department, id, nickname }) => ({
    avatar_url,
    department,
    id,
    nickname,
  }));
}

export async function getSentRequests(): Promise<ConnectionUser[]> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc("get_sent_requests");

  if (error || !data) {
    throw new Error("보낸 요청 목록을 불러오지 못했습니다.");
  }

  return data.map(({ avatar_url, department, id, nickname }) => ({
    avatar_url,
    department,
    id,
    nickname,
  }));
}
