import { PAGE_SIZE } from "../../lib/constants/pagination";
import { getSupabaseMobileClient } from "../../lib/supabase";
import {
  getBlockRelatedUserIds,
  getCurrentUserContext,
} from "../shared/userContext";
import type {
  FeedPost,
  FeedRankCursor,
  GetFeedResult,
  GetRankedFeedResult,
  GetRankedReelsResult,
} from "./types";
import { hydrateFeedPosts } from "./feedHydration";
import {
  POST_WITH_RELATIONS_SELECT_FIELDS,
  POST_WITH_VIDEO_MEDIA_SELECT_FIELDS,
  type FeedPostRow,
} from "./internalTypes";

// PostgREST `in` 필터용 문자열로 변환: ["a","b"] → "(a,b)".
function toPostgrestInFilter(values: string[]) {
  return `(${values.join(",")})`;
}

// 앱 DB 타입 파일에는 FK Relationships가 비어 있어 supabase-js가 임베딩 타입을 추론하지 못한다.
// 실제 PostgREST 응답은 아래 select 문자열 기준으로 FeedPostRow shape이므로 여기서만 명시 캐스팅한다.
function toEmbeddedFeedPostRows(rows: unknown): FeedPostRow[] {
  return rows as FeedPostRow[];
}

function toEmbeddedFeedPostRow(row: unknown): FeedPostRow {
  return row as FeedPostRow;
}

type RankedFeedPostIdRow = {
  band: number;
  post_id: string;
  rank: number;
};

// 홈 피드 조회. 같은 학교 + 차단 관계 제외, created_at cursor 무한스크롤.
export async function getFeed({
  cursor,
  limit = PAGE_SIZE.feed,
}: {
  cursor?: string;
  limit?: number;
} = {}): Promise<GetFeedResult> {
  const supabase = getSupabaseMobileClient();
  const { universityId, userId } = await getCurrentUserContext();
  const blockRelatedUserIds = await getBlockRelatedUserIds();
  const fetchLimit = limit + 1;

  let postsQuery = supabase
    .from("posts")
    .select(POST_WITH_RELATIONS_SELECT_FIELDS)
    .eq("university_id", universityId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .order("order_index", { ascending: true, referencedTable: "post_media" })
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

  const normalizedPosts = toEmbeddedFeedPostRows(postsData);
  const hasMore = normalizedPosts.length > limit;
  const slicedPosts = hasMore ? normalizedPosts.slice(0, limit) : normalizedPosts;
  const posts = await hydrateFeedPosts(slicedPosts, userId);

  return {
    nextCursor: hasMore ? posts[posts.length - 1]?.created_at ?? null : null,
    posts,
  };
}

// 홈 피드 순서는 DB 함수가 정하고, 내용은 기존 posts 임베딩 조회/hydration을 재사용한다.
export async function getFeedRanked({
  afterBand,
  afterRank,
  limit = PAGE_SIZE.feed,
  seed,
}: {
  afterBand?: number | null;
  afterRank?: number | null;
  limit?: number;
  seed: number;
}): Promise<GetRankedFeedResult> {
  const supabase = getSupabaseMobileClient();
  const { userId } = await getCurrentUserContext();
  const fetchLimit = limit + 1;

  const { data: rankedData, error: rankedError } = await supabase.rpc(
    "get_feed_post_ids",
    {
      p_after_band: afterBand ?? null,
      p_after_rank: afterRank ?? null,
      p_limit: fetchLimit,
      p_seed: seed,
    },
  );

  if (rankedError || !rankedData) {
    throw new Error("피드를 불러오지 못했습니다.");
  }

  const rankedRows = rankedData as RankedFeedPostIdRow[];
  const hasMore = rankedRows.length > limit;
  const pageRankedRows = hasMore ? rankedRows.slice(0, limit) : rankedRows;

  if (pageRankedRows.length === 0) {
    return {
      nextCursor: null,
      postRanks: new Map(),
      posts: [],
    };
  }

  const postIds = pageRankedRows.map((row) => row.post_id);
  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select(POST_WITH_RELATIONS_SELECT_FIELDS)
    .in("id", postIds)
    .is("deleted_at", null)
    .order("order_index", { ascending: true, referencedTable: "post_media" });

  if (postsError || !postsData) {
    throw new Error("피드를 불러오지 못했습니다.");
  }

  const rowsById = new Map(
    toEmbeddedFeedPostRows(postsData).map((postRow) => [postRow.id, postRow]),
  );
  const orderedRows = pageRankedRows
    .map((rankedRow) => rowsById.get(rankedRow.post_id) ?? null)
    .filter((postRow): postRow is FeedPostRow => postRow !== null);
  const posts = await hydrateFeedPosts(orderedRows, userId);
  const rankByPostId = new Map(
    pageRankedRows.map((row) => [
      row.post_id,
      {
        band: row.band,
        rank: row.rank,
      },
    ]),
  );
  const lastRankedRow = pageRankedRows[pageRankedRows.length - 1];
  const nextCursor: FeedRankCursor | null =
    hasMore && lastRankedRow
      ? { band: lastRankedRow.band, rank: lastRankedRow.rank }
      : null;

  return {
    nextCursor,
    postRanks: rankByPostId,
    posts,
  };
}

// 릴스 순서는 DB 함수가 정하고, 내용은 기존 영상 posts 임베딩 조회/hydration을 재사용한다.
export async function getReelsRanked({
  afterBand,
  afterRank,
  limit = PAGE_SIZE.feed,
  seed,
  seenIds,
}: {
  afterBand?: number | null;
  afterRank?: number | null;
  limit?: number;
  seed: number;
  seenIds: string[];
}): Promise<GetRankedReelsResult> {
  const supabase = getSupabaseMobileClient();
  const { userId } = await getCurrentUserContext();
  const fetchLimit = limit + 1;

  const { data: rankedData, error: rankedError } = await supabase.rpc(
    "get_reel_post_ids",
    {
      p_after_band: afterBand ?? null,
      p_after_rank: afterRank ?? null,
      p_limit: fetchLimit,
      p_seed: seed,
      p_seen_ids: seenIds,
    },
  );

  if (rankedError || !rankedData) {
    throw new Error("영상을 불러오지 못했습니다.");
  }

  const rankedRows = rankedData as RankedFeedPostIdRow[];
  const hasMore = rankedRows.length > limit;
  const pageRankedRows = hasMore ? rankedRows.slice(0, limit) : rankedRows;

  if (pageRankedRows.length === 0) {
    return {
      nextCursor: null,
      posts: [],
    };
  }

  const postIds = pageRankedRows.map((row) => row.post_id);
  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select(POST_WITH_VIDEO_MEDIA_SELECT_FIELDS)
    .in("id", postIds)
    .eq("post_media.type", "video")
    .is("deleted_at", null)
    .order("order_index", { ascending: true, referencedTable: "post_media" });

  if (postsError || !postsData) {
    throw new Error("영상을 불러오지 못했습니다.");
  }

  const rowsById = new Map(
    toEmbeddedFeedPostRows(postsData).map((postRow) => [postRow.id, postRow]),
  );
  const orderedRows = pageRankedRows
    .map((rankedRow) => rowsById.get(rankedRow.post_id) ?? null)
    .filter((postRow): postRow is FeedPostRow => postRow !== null);
  const posts = await hydrateFeedPosts(orderedRows, userId);
  const lastRankedRow = pageRankedRows[pageRankedRows.length - 1];
  const nextCursor: FeedRankCursor | null =
    hasMore && lastRankedRow
      ? { band: lastRankedRow.band, rank: lastRankedRow.rank }
      : null;

  return {
    nextCursor,
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
  const { universityId, userId } = await getCurrentUserContext();
  const blockRelatedUserIds = await getBlockRelatedUserIds();
  const fetchLimit = limit + 1;

  let postsQuery = supabase
    .from("posts")
    .select(POST_WITH_VIDEO_MEDIA_SELECT_FIELDS)
    .eq("university_id", universityId)
    .eq("post_media.type", "video")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .order("order_index", { ascending: true, referencedTable: "post_media" })
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

  const normalizedPosts = toEmbeddedFeedPostRows(postsData);
  const hasMore = normalizedPosts.length > limit;
  const slicedPosts = hasMore ? normalizedPosts.slice(0, limit) : normalizedPosts;
  const posts = await hydrateFeedPosts(slicedPosts, userId);

  return {
    nextCursor: hasMore ? posts[posts.length - 1]?.created_at ?? null : null,
    posts,
  };
}

// 단일 게시물 상세 조회. FeedPost 형태로 반환해 FeedPostCard가 그대로 렌더할 수 있게 한다.
export async function getPost(postId: string): Promise<FeedPost> {
  const supabase = getSupabaseMobileClient();
  const { userId } = await getCurrentUserContext();
  const blockRelatedUserIds = await getBlockRelatedUserIds();

  const { data: postData, error: postError } = await supabase
    .from("posts")
    .select(POST_WITH_RELATIONS_SELECT_FIELDS)
    .eq("id", postId)
    .is("deleted_at", null)
    .order("order_index", { ascending: true, referencedTable: "post_media" })
    .maybeSingle();

  if (postError || !postData) {
    throw new Error("게시물을 찾을 수 없습니다.");
  }

  const post = toEmbeddedFeedPostRow(postData);

  if (blockRelatedUserIds.includes(post.user_id)) {
    throw new Error("게시물을 찾을 수 없습니다.");
  }

  const [hydratedPost] = await hydrateFeedPosts([post], userId);

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
