import type { Database } from "../../types/database.types";
import { getSupabaseMobileClient } from "../../lib/supabase";
import type {
  ProfileCounts,
  ProfileDetail,
  ProfileGridPost,
  ProfileLink,
} from "./types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];
type ProfileLinkRow = Database["public"]["Tables"]["profile_links"]["Row"];

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

  let crew = 0;
  const { data, error } = await supabase.rpc("get_connection_status", {
    target_user_id: userId,
  });

  if (
    !error &&
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "friends_count" in data
  ) {
    const friendsCount = (data as { friends_count?: unknown }).friends_count;
    crew = typeof friendsCount === "number" ? friendsCount : 0;
  }

  return { crew, posts: count ?? 0 };
}
