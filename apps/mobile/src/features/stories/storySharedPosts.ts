import { getSupabaseMobileClient } from "../../lib/supabase";
import type { StorySharedPost } from "./types";

type SharedPostRow = {
  content: string | null;
  id: string;
  post_media: Array<{
    order_index: number;
    thumbnail_url: string | null;
    type: "image" | "video";
    url: string;
  }> | null;
  user: {
    avatar_url: string | null;
    id: string;
    nickname: string;
  } | null;
};

const SHARED_POST_SELECT_FIELDS =
  "id, content, user:users!posts_user_id_fkey(id, nickname, avatar_url), post_media(type, url, thumbnail_url, order_index)" as const;

function toSharedPostRows(rows: unknown): SharedPostRow[] {
  return rows as SharedPostRow[];
}

function mapSharedPost(row: SharedPostRow): StorySharedPost | null {
  if (!row.user) {
    return null;
  }

  const firstMedia = [...(row.post_media ?? [])].sort(
    (left, right) => left.order_index - right.order_index,
  )[0];

  return {
    content: row.content,
    id: row.id,
    media: firstMedia
      ? {
          thumbnailUrl: firstMedia.thumbnail_url,
          type: firstMedia.type,
          url: firstMedia.url,
        }
      : null,
    user: row.user,
  };
}

export function getStorySharedPostThumbnail(
  post: StorySharedPost | null,
): string | null {
  if (!post?.media) {
    return null;
  }

  return post.media.type === "video"
    ? post.media.thumbnailUrl
    : post.media.thumbnailUrl ?? post.media.url;
}

// 스토리 목록의 원본 게시물을 한 번에 조회한다. posts RLS가 원본 공개범위와 차단을 적용한다.
export async function getStorySharedPosts(
  postIds: string[],
): Promise<Map<string, StorySharedPost>> {
  const uniqueIds = Array.from(new Set(postIds));

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase
    .from("posts")
    .select(SHARED_POST_SELECT_FIELDS)
    .in("id", uniqueIds)
    .is("deleted_at", null)
    .order("order_index", { ascending: true, referencedTable: "post_media" });

  if (error || !data) {
    throw new Error("공유 게시물 정보를 불러오지 못했습니다.");
  }

  return new Map(
    toSharedPostRows(data).flatMap((row) => {
      const post = mapSharedPost(row);
      return post ? [[post.id, post] as const] : [];
    }),
  );
}

export async function getStorySharedPostPreview(
  postId: string,
): Promise<StorySharedPost> {
  const post = (await getStorySharedPosts([postId])).get(postId);

  if (!post) {
    throw new Error("게시물을 찾을 수 없습니다.");
  }

  return post;
}
