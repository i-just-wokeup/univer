import type { Database } from "../../types/database.types";
import { getSupabaseMobileClient } from "../../lib/supabase";
import type { ProfileGridPost, ProfileSummary } from "./types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];

async function getCurrentUserId() {
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

export async function getMyProfile(): Promise<ProfileSummary> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("users")
    .select("id, nickname, bio, avatar_url, department")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("프로필을 불러오지 못했습니다.");
  }

  const { count, error: countError } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (countError) {
    throw new Error("게시물 수를 불러오지 못했습니다.");
  }

  const profile = data as Pick<
    UserRow,
    "id" | "nickname" | "bio" | "avatar_url" | "department"
  >;

  return {
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    department: profile.department,
    id: profile.id,
    nickname: profile.nickname,
    posts_count: count ?? 0,
  };
}

export async function getMyProfilePosts(): Promise<ProfileGridPost[]> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();

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
