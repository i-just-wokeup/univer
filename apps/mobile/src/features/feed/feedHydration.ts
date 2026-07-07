import { getSupabaseMobileClient } from "../../lib/supabase";
import type { FeedPost, FeedUser, PostMedia } from "./types";
import {
  POST_MEDIA_SELECT_FIELDS,
  USER_SELECT_FIELDS,
  type FeedPostRow,
  type PostMediaRow,
  type UserRow,
} from "./internalTypes";

// posts 테이블 row는 작성자/미디어를 포함하지 않는다.
// 피드·릴스·상세가 같은 FeedPost UI 타입을 쓰도록 이 파일에서 한 번에 붙인다.
export async function hydrateFeedPosts(
  postRows: FeedPostRow[],
): Promise<FeedPost[]> {
  if (postRows.length === 0) {
    return [];
  }

  const supabase = getSupabaseMobileClient();
  const postIds = postRows.map((post) => post.id);
  const userIds = Array.from(new Set(postRows.map((post) => post.user_id)));

  const [
    { data: usersData, error: usersError },
    { data: mediaData, error: mediaError },
  ] = await Promise.all([
    supabase.from("users").select(USER_SELECT_FIELDS).in("id", userIds),
    supabase
      .from("post_media")
      .select(POST_MEDIA_SELECT_FIELDS)
      .in("post_id", postIds)
      .order("order_index", { ascending: true }),
  ]);

  if (usersError || !usersData) {
    throw new Error("작성자 정보를 불러오지 못했습니다.");
  }

  if (mediaError || !mediaData) {
    throw new Error("게시물 미디어를 불러오지 못했습니다.");
  }

  const usersById = new Map<string, FeedUser>(
    (
      usersData as Pick<
        UserRow,
        "avatar_url" | "department" | "id" | "nickname"
      >[]
    ).map((user) => [
      user.id,
      {
        avatar_url: user.avatar_url,
        department: user.department,
        id: user.id,
        nickname: user.nickname,
      },
    ]),
  );

  const mediaByPostId = new Map<string, PostMedia[]>();

  (mediaData as PostMediaRow[]).forEach((media) => {
    const currentMedia = mediaByPostId.get(media.post_id) ?? [];
    currentMedia.push({
      duration: media.duration,
      id: media.id,
      order_index: media.order_index,
      processing_status: media.processing_status,
      provider: media.provider,
      provider_asset_id: media.provider_asset_id,
      thumbnail_url: media.thumbnail_url,
      type: media.type,
      url: media.url,
    });
    mediaByPostId.set(media.post_id, currentMedia);
  });

  return postRows.map((post) => {
    const user = usersById.get(post.user_id);

    if (!user) {
      throw new Error("게시물 작성자 정보를 찾을 수 없습니다.");
    }

    return {
      aspect_ratio: post.aspect_ratio ?? "portrait",
      comments_count: post.comments_count,
      content: post.content,
      created_at: post.created_at,
      id: post.id,
      likes_count: post.likes_count,
      media: mediaByPostId.get(post.id) ?? [],
      user,
      visibility: post.visibility,
    };
  });
}
