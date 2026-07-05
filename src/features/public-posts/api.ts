import { getSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database.types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type PublicPostPreviewMedia = Pick<
  PostMediaRow,
  "id" | "order_index" | "thumbnail_url" | "type" | "url"
>;

export type PublicPostPreview = Pick<
  PostRow,
  | "aspect_ratio"
  | "comments_count"
  | "content"
  | "created_at"
  | "id"
  | "likes_count"
> & {
  media: PublicPostPreviewMedia[];
  user: Pick<UserRow, "avatar_url" | "department" | "nickname">;
};

export async function getPublicPostPreview(
  postId: string,
): Promise<PublicPostPreview | null> {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return null;
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select(
      "id, user_id, content, created_at, likes_count, comments_count, aspect_ratio, visibility, deleted_at",
    )
    .eq("id", postId)
    .maybeSingle();

  if (
    postError ||
    !post ||
    post.visibility !== "public" ||
    post.deleted_at !== null
  ) {
    return null;
  }

  const [
    { data: user, error: userError },
    { data: media, error: mediaError },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("nickname, department, avatar_url")
      .eq("id", post.user_id)
      .maybeSingle(),
    supabase
      .from("post_media")
      .select("id, type, url, thumbnail_url, order_index")
      .eq("post_id", post.id)
      .order("order_index", { ascending: true }),
  ]);

  if (userError || !user || mediaError || !media) {
    return null;
  }

  return {
    aspect_ratio: post.aspect_ratio,
    comments_count: post.comments_count,
    content: post.content,
    created_at: post.created_at,
    id: post.id,
    likes_count: post.likes_count,
    media,
    user,
  };
}

