import { PAGE_SIZE } from "../../lib/constants/pagination";
import { getSupabaseMobileClient } from "../../lib/supabase";
import {
  getBlockRelatedUserIds,
  getCurrentUserContext,
} from "../shared/userContext";
import type { FeedPost, GetFeedResult } from "./types";
import { hydrateFeedPosts } from "./feedHydration";
import {
  POST_SELECT_FIELDS,
  type FeedPostRow,
} from "./internalTypes";

// PostgREST `in` 필터용 문자열로 변환: ["a","b"] → "(a,b)".
function toPostgrestInFilter(values: string[]) {
  return `(${values.join(",")})`;
}

// 홈 피드 조회. 같은 학교 + 차단 관계 제외, created_at cursor 무한스크롤.
export async function getFeed({
  cursor,
  limit = PAGE_SIZE.feed,
}: {
  cursor?: string;
  limit?: number;
} = {}): Promise<GetFeedResult> {
  const supabase = getSupabaseMobileClient();
  const { universityId } = await getCurrentUserContext();
  const blockRelatedUserIds = await getBlockRelatedUserIds();
  const fetchLimit = limit + 1;

  let postsQuery = supabase
    .from("posts")
    .select(POST_SELECT_FIELDS)
    .eq("university_id", universityId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (blockRelatedUserIds.length > 0) {
    postsQuery = postsQuery.not(
      "user_id",
      "in",
      toPostgrestInFilter(blockRelatedUserIds),
    );
  }

  if (cursor) {
    postsQuery = postsQuery.lt("created_at", cursor);
  }

  const { data: postsData, error: postsError } = await postsQuery;

  if (postsError || !postsData) {
    throw new Error("피드를 불러오지 못했습니다.");
  }

  const normalizedPosts = postsData as FeedPostRow[];
  const hasMore = normalizedPosts.length > limit;
  const slicedPosts = hasMore ? normalizedPosts.slice(0, limit) : normalizedPosts;
  const posts = await hydrateFeedPosts(slicedPosts);

  return {
    nextCursor: hasMore ? posts[posts.length - 1]?.created_at ?? null : null,
    posts,
  };
}

// 영상 전용 피드(릴스). post_media inner join으로 영상이 있는 게시물만 가져온다.
export async function getVideoFeed({
  anchorCreatedAt,
  cursor,
  limit = PAGE_SIZE.feed,
}: {
  anchorCreatedAt?: string;
  cursor?: string;
  limit?: number;
} = {}): Promise<GetFeedResult> {
  const supabase = getSupabaseMobileClient();
  const { universityId } = await getCurrentUserContext();
  const blockRelatedUserIds = await getBlockRelatedUserIds();
  const fetchLimit = limit + 1;

  let postsQuery = supabase
    .from("posts")
    .select(`${POST_SELECT_FIELDS}, post_media!inner(type)`)
    .eq("university_id", universityId)
    .eq("post_media.type", "video")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (blockRelatedUserIds.length > 0) {
    postsQuery = postsQuery.not(
      "user_id",
      "in",
      toPostgrestInFilter(blockRelatedUserIds),
    );
  }

  if (cursor) {
    postsQuery = postsQuery.lt("created_at", cursor);
  } else if (anchorCreatedAt) {
    postsQuery = postsQuery.lte("created_at", anchorCreatedAt);
  }

  const { data: postsData, error: postsError } = await postsQuery;

  if (postsError || !postsData) {
    throw new Error("영상을 불러오지 못했습니다.");
  }

  const normalizedPosts = postsData as unknown as FeedPostRow[];
  const hasMore = normalizedPosts.length > limit;
  const slicedPosts = hasMore ? normalizedPosts.slice(0, limit) : normalizedPosts;
  const posts = await hydrateFeedPosts(slicedPosts);

  return {
    nextCursor: hasMore ? posts[posts.length - 1]?.created_at ?? null : null,
    posts,
  };
}

// 단일 게시물 상세 조회. FeedPost 형태로 반환해 FeedPostCard가 그대로 렌더할 수 있게 한다.
export async function getPost(postId: string): Promise<FeedPost> {
  const supabase = getSupabaseMobileClient();
  const blockRelatedUserIds = await getBlockRelatedUserIds();

  const { data: postData, error: postError } = await supabase
    .from("posts")
    .select(POST_SELECT_FIELDS)
    .eq("id", postId)
    .is("deleted_at", null)
    .maybeSingle();

  if (postError || !postData) {
    throw new Error("게시물을 찾을 수 없습니다.");
  }

  const post = postData as FeedPostRow;

  if (blockRelatedUserIds.includes(post.user_id)) {
    throw new Error("게시물을 찾을 수 없습니다.");
  }

  const [hydratedPost] = await hydrateFeedPosts([post]);

  if (!hydratedPost) {
    throw new Error("게시물을 찾을 수 없습니다.");
  }

  return hydratedPost;
}

// 게시물의 작성 시각만 가볍게 조회. 릴스 앵커처럼 created_at 하나만 필요할 때 쓴다.
// (getPost는 차단목록+미디어+해시태그까지 다 채워서 무겁다.)
export async function getPostCreatedAt(postId: string): Promise<string | null> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase
    .from("posts")
    .select("created_at")
    .eq("id", postId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.created_at;
}
