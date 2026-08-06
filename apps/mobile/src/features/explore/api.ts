// 탐색 데이터 계층 — 인기 순위(get_popular_post_ids RPC) 기반 그리드.
// RPC가 같은 학교·전체공개·차단 제외·미디어 존재를 처리(핫스코어 순). 앱은 그 순서로 썸네일을 채운다.
import type { Database } from "../../types/database.types";
import { PAGE_SIZE } from "../../lib/constants/pagination";
import { getSupabaseMobileClient } from "../../lib/supabase";
import type { PostAspectRatio } from "../feed/types";
import type {
  ExplorePost,
  GetExplorePostsParams,
  GetExplorePostsResult,
} from "./types";

type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];

export async function getExplorePosts({
  limit = PAGE_SIZE.explore,
  offset = 0,
}: GetExplorePostsParams = {}): Promise<GetExplorePostsResult> {
  const supabase = getSupabaseMobileClient();

  // 이미지 없는 글 등으로 페이지가 줄 수 있어 한 칸 더 받아 hasMore를 판단한다.
  const { data: rankedData, error: rankedError } = await supabase.rpc(
    "get_popular_post_ids",
    { p_limit: limit + 1, p_offset: offset },
  );

  if (rankedError || !Array.isArray(rankedData)) {
    throw new Error("탐색 게시물을 불러오지 못했습니다.");
  }

  const rankedIds = rankedData
    .map((row) => row.post_id)
    .filter((id): id is string => typeof id === "string");

  const hasMore = rankedIds.length > limit;
  const pageIds = hasMore ? rankedIds.slice(0, limit) : rankedIds;

  if (pageIds.length === 0) {
    return { hasMore: false, posts: [] };
  }

  const [postsResult, mediaResult] = await Promise.all([
    supabase
      .from("posts")
      .select("id, aspect_ratio, likes_count, comments_count")
      .in("id", pageIds),
    supabase
      .from("post_media")
      .select("post_id, url, thumbnail_url, type, order_index")
      .in("post_id", pageIds)
      .eq("order_index", 0),
  ]);

  if (postsResult.error || !postsResult.data) {
    throw new Error("탐색 게시물을 불러오지 못했습니다.");
  }
  if (mediaResult.error || !mediaResult.data) {
    throw new Error("탐색 게시물 이미지를 불러오지 못했습니다.");
  }

  const postById = new Map(
    postsResult.data.map((post) => [post.id, post] as const),
  );

  const thumbnailByPostId = new Map<string, string>();
  const isVideoByPostId = new Map<string, boolean>();

  (
    mediaResult.data as Pick<
      PostMediaRow,
      "order_index" | "post_id" | "thumbnail_url" | "type" | "url"
    >[]
  ).forEach((media) => {
    const thumbnail =
      media.type === "video" ? media.thumbnail_url ?? media.url : media.url;

    if (thumbnail && !thumbnailByPostId.has(media.post_id)) {
      thumbnailByPostId.set(media.post_id, thumbnail);
      isVideoByPostId.set(media.post_id, media.type === "video");
    }
  });

  // RPC가 준 인기 순서를 유지해 조립. 썸네일 없는 글은 제외.
  const posts: ExplorePost[] = pageIds.reduce<ExplorePost[]>((items, id) => {
    const post = postById.get(id);
    const thumbnailUrl = thumbnailByPostId.get(id);

    if (!post || !thumbnailUrl) {
      return items;
    }

    items.push({
      aspect_ratio: (post.aspect_ratio as PostAspectRatio) ?? "portrait",
      comments_count: post.comments_count,
      id,
      is_video: isVideoByPostId.get(id) ?? false,
      likes_count: post.likes_count,
      thumbnail_url: thumbnailUrl,
    });

    return items;
  }, []);

  return { hasMore, posts };
}
