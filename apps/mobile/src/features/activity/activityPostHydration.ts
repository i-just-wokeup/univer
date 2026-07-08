import { getSupabaseMobileClient } from "../../lib/supabase";
import {
  getBlockRelatedUserIds,
  getCurrentUserContext,
} from "../shared/userContext";
import type { ActivityPost, ActivityPostMedia, PostMediaRow } from "./activityTypes";

// 저장/좋아요/댓글 탭이 공통으로 쓰는 게시물 조립 로직.
// 입력 postIds 순서를 유지하면서 미디어/작성자 정보와 차단 필터를 한 번에 적용한다.
export async function getActivityPostsByIds(
  postIds: string[],
  savedAtByPostId?: Map<string, string>,
): Promise<ActivityPost[]> {
  if (postIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseMobileClient();
  const { universityId } = await getCurrentUserContext();
  const blockRelatedUserIds = await getBlockRelatedUserIds();
  const blockedUserIds = new Set(blockRelatedUserIds);

  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select("id, user_id, content, created_at, likes_count, comments_count")
    .eq("university_id", universityId)
    .is("deleted_at", null)
    .in("id", postIds);

  if (postsError || !postsData) {
    throw new Error("게시물을 불러오지 못했습니다.");
  }

  // 차단한(또는 나를 차단한) 유저의 게시물은 내 활동 목록에서만 숨긴다.
  // 좋아요/저장/댓글 기록 자체는 보존되어 언블락하면 다시 보인다.
  const posts = postsData.filter((post) => !blockedUserIds.has(post.user_id));

  if (posts.length === 0) {
    return [];
  }

  const visiblePostIds = posts.map((post) => post.id);
  const userIds = Array.from(new Set(posts.map((post) => post.user_id)));
  const [
    { data: mediaRows, error: mediaError },
    { data: userRows, error: usersError },
  ] = await Promise.all([
    supabase
      .from("post_media")
      .select("id, post_id, type, url, thumbnail_url, order_index")
      .in("post_id", visiblePostIds)
      .order("order_index", { ascending: true }),
    supabase
      .from("users")
      .select("id, nickname, department, avatar_url")
      .in("id", userIds),
  ]);

  if (mediaError || !mediaRows) {
    throw new Error("게시물 이미지를 불러오지 못했습니다.");
  }

  if (usersError || !userRows) {
    throw new Error("작성자 정보를 불러오지 못했습니다.");
  }

  const mediaByPostId = new Map<string, ActivityPostMedia[]>();
  mediaRows.forEach(
    (
      media: Pick<
        PostMediaRow,
        "id" | "order_index" | "post_id" | "thumbnail_url" | "type" | "url"
      >,
    ) => {
      const currentMedia = mediaByPostId.get(media.post_id) ?? [];
      currentMedia.push({
        id: media.id,
        order_index: media.order_index,
        thumbnail_url: media.thumbnail_url,
        type: media.type,
        url: media.url,
      });
      mediaByPostId.set(media.post_id, currentMedia);
    },
  );

  const usersById = new Map(
    userRows.map((user) => [
      user.id,
      {
        avatar_url: user.avatar_url,
        department: user.department,
        id: user.id,
        nickname: user.nickname,
      },
    ]),
  );
  const postsById = new Map(posts.map((post) => [post.id, post]));

  return postIds.reduce<ActivityPost[]>((items, postId) => {
    const post = postsById.get(postId);
    const user = post ? usersById.get(post.user_id) : null;

    if (!post || !user) {
      return items;
    }

    items.push({
      comments_count: post.comments_count,
      content: post.content,
      created_at: post.created_at,
      id: post.id,
      likes_count: post.likes_count,
      media: mediaByPostId.get(post.id) ?? [],
      saved_at: savedAtByPostId?.get(post.id),
      user,
    });

    return items;
  }, []);
}
