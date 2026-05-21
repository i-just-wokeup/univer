import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Json } from "@/types/database.types";
import type { Database } from "@/types/database.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];

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
>;

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

type UserLikeStatus = {
  is_liked: boolean;
  likes_count: number;
};

function isUserLikeStatus(value: Json | null): value is UserLikeStatus {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return (
    "is_liked" in value &&
    typeof value.is_liked === "boolean" &&
    "likes_count" in value &&
    typeof value.likes_count === "number"
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
      "id, nickname, real_name, bio, avatar_url, department, university_id, created_at",
    )
    .eq("nickname", trimmedNickname)
    .maybeSingle();

  if (error || !data) {
    throw new Error("프로필을 찾을 수 없습니다.");
  }

  return data satisfies Profile;
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

export async function toggleUserLike(userId: string): Promise<void> {
  const supabase = requireSupabaseClient();

  const { error } = await supabase.rpc("toggle_user_like", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error("유저 좋아요 처리에 실패했습니다.");
  }
}

export async function getUserLikeStatus(
  userId: string,
): Promise<UserLikeStatus> {
  const supabase = requireSupabaseClient();

  const { data, error } = await supabase.rpc("get_user_like_status", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error("유저 좋아요 상태를 불러오지 못했습니다.");
  }

  const normalizedData = (data ?? null) as Json | null;

  if (!isUserLikeStatus(normalizedData)) {
    throw new Error("유저 좋아요 상태 응답 형식이 올바르지 않습니다.");
  }

  return normalizedData;
}
