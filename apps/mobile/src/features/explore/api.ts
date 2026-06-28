// 탐색 데이터 계층 — 같은 학교 전체공개 인기 게시물 그리드 조회(offset 페이지네이션).
import type { Database } from "../../types/database.types";
import { PAGE_SIZE } from "../../lib/constants/pagination";
import { getSupabaseMobileClient } from "../../lib/supabase";
import type { PostAspectRatio } from "../feed/types";
import {
  getBlockRelatedUserIds,
  getCurrentUserContext,
} from "../shared/userContext";
import type {
  ExplorePost,
  GetExplorePostsParams,
  GetExplorePostsResult,
} from "./types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];

type ExplorePostRow = Pick<
  PostRow,
  "comments_count" | "created_at" | "id" | "likes_count" | "user_id"
> & {
  aspect_ratio?: PostAspectRatio;
};

// PostgREST `in` 필터용 문자열: ["a","b"] → "(a,b)".
function toPostgrestInFilter(values: string[]) {
  return `(${values.join(",")})`;
}

// 같은 학교 전체공개 게시물 중 대표 이미지가 있는 글을 인기순으로 모아 탐색 그리드를 구성한다.
export async function getExplorePosts({
  limit = PAGE_SIZE.explore,
  offset = 0,
}: GetExplorePostsParams = {}): Promise<GetExplorePostsResult> {
  const supabase = getSupabaseMobileClient();
  const { universityId, userId } = await getCurrentUserContext();
  const blockRelatedUserIds = await getBlockRelatedUserIds();

  // 이미지 없는 글을 걸러내면 페이지 크기가 줄 수 있어 한 칸 더 받아 hasMore를 판단한다.
  let postsQuery = supabase
    .from("posts")
    .select("id, user_id, aspect_ratio, likes_count, comments_count, created_at")
    .eq("university_id", universityId)
    .eq("visibility", "public")
    .is("deleted_at", null)
    .neq("user_id", userId)
    .order("likes_count", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (blockRelatedUserIds.length > 0) {
    postsQuery = postsQuery.not(
      "user_id",
      "in",
      toPostgrestInFilter(blockRelatedUserIds),
    );
  }

  const { data: postsData, error: postsError } = await postsQuery;

  if (postsError || !postsData) {
    throw new Error("탐색 게시물을 불러오지 못했습니다.");
  }

  const normalizedPosts = postsData as ExplorePostRow[];
  const hasMore = normalizedPosts.length > limit;
  const slicedPosts = hasMore ? normalizedPosts.slice(0, limit) : normalizedPosts;

  if (slicedPosts.length === 0) {
    return { hasMore: false, posts: [] };
  }

  const postIds = slicedPosts.map((post) => post.id);
  const { data: mediaData, error: mediaError } = await supabase
    .from("post_media")
    .select("post_id, url, order_index")
    .in("post_id", postIds)
    .eq("type", "image")
    .eq("order_index", 0);

  if (mediaError || !mediaData) {
    throw new Error("탐색 게시물 이미지를 불러오지 못했습니다.");
  }

  const thumbnailByPostId = new Map<string, string>(
    (mediaData as Pick<PostMediaRow, "order_index" | "post_id" | "url">[]).map(
      (media) => [media.post_id, media.url],
    ),
  );

  const posts: ExplorePost[] = slicedPosts.reduce<ExplorePost[]>(
    (items, post) => {
      const thumbnailUrl = thumbnailByPostId.get(post.id);

      if (!thumbnailUrl) {
        return items;
      }

      items.push({
        aspect_ratio: post.aspect_ratio ?? "portrait",
        comments_count: post.comments_count,
        id: post.id,
        likes_count: post.likes_count,
        thumbnail_url: thumbnailUrl,
      });

      return items;
    },
    [],
  );

  return { hasMore, posts };
}
