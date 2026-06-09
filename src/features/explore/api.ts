import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getBlockRelatedUserIds } from "@/features/blocks/api";
import { getCurrentUserUniversityId } from "@/features/feed/api";

// 탐색 그리드 한 칸에 필요한 최소 정보. 썸네일과 지표만 노출한다.
export type ExplorePost = {
  comments_count: number;
  id: string;
  likes_count: number;
  thumbnail_url: string;
};

export type GetExplorePostsParams = {
  limit?: number;
  offset?: number;
};

export type GetExplorePostsResult = {
  hasMore: boolean;
  posts: ExplorePost[];
};

function requireSupabaseClient() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  return supabase;
}

function toPostgrestInFilter(values: string[]) {
  return `(${values.join(",")})`;
}

// 같은 학교 전체공개 게시물 중 이미지가 있는 글을 인기순으로 모아 탐색 그리드를 구성한다.
// 타 학교가 생기기 전까지는 같은 학교 콘텐츠로 그리드 UX를 자리잡게 하는 임시 구현이다.
export async function getExplorePosts({
  limit = 24,
  offset = 0,
}: GetExplorePostsParams = {}): Promise<GetExplorePostsResult> {
  const supabase = requireSupabaseClient();
  const { universityId, userId } = await getCurrentUserUniversityId();
  const blockRelatedUserIds = await getBlockRelatedUserIds();

  // 이미지 없는 글을 걸러내면 페이지 크기가 줄어들 수 있어 한 칸 더 받아 hasMore를 판단한다.
  let postsQuery = supabase
    .from("posts")
    .select("id, user_id, likes_count, comments_count, created_at")
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

  const hasMore = postsData.length > limit;
  const slicedPosts = hasMore ? postsData.slice(0, limit) : postsData;

  if (slicedPosts.length === 0) {
    return {
      hasMore: false,
      posts: [],
    };
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

  // 대표 이미지(order_index 0)가 있는 게시물만 그리드에 노출한다.
  const thumbnailByPostId = new Map<string, string>(
    mediaData.map((media) => [media.post_id, media.url]),
  );

  const posts: ExplorePost[] = slicedPosts.reduce<ExplorePost[]>(
    (items, post) => {
      const thumbnailUrl = thumbnailByPostId.get(post.id);

      if (!thumbnailUrl) {
        return items;
      }

      items.push({
        comments_count: post.comments_count,
        id: post.id,
        likes_count: post.likes_count,
        thumbnail_url: thumbnailUrl,
      });

      return items;
    },
    [],
  );

  return {
    hasMore,
    posts,
  };
}
