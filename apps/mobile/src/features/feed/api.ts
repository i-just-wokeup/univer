import type { Database } from "../../types/database.types";
import { getSupabaseMobileClient } from "../../lib/supabase";
import type { FeedPost, FeedUser, GetFeedResult, PostAspectRatio, PostMedia } from "./types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type PostLikeRow = Database["public"]["Tables"]["post_likes"]["Row"];

type FeedPostRow = Pick<
  PostRow,
  "comments_count" | "content" | "created_at" | "id" | "likes_count" | "user_id"
> & {
  aspect_ratio?: PostAspectRatio;
};

function toPostgrestInFilter(values: string[]) {
  return `(${values.join(",")})`;
}

async function getCurrentUserContext() {
  const supabase = getSupabaseMobileClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("users")
    .select("university_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data?.university_id) {
    throw new Error("현재 로그인 유저의 학교 정보를 찾을 수 없습니다.");
  }

  return {
    universityId: data.university_id,
    userId: user.id,
  };
}

async function getBlockRelatedUserIds() {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_block_related_user_ids");

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data
    .map((row) => row.user_id)
    .filter((userId): userId is string => typeof userId === "string");
}

export async function getFeed({
  cursor,
  limit = 20,
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
    .select("id, aspect_ratio, content, created_at, likes_count, comments_count, user_id")
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

  if (slicedPosts.length === 0) {
    return {
      nextCursor: null,
      posts: [],
    };
  }

  const postIds = slicedPosts.map((post) => post.id);
  const userIds = Array.from(new Set(slicedPosts.map((post) => post.user_id)));

  const [{ data: usersData, error: usersError }, { data: mediaData, error: mediaError }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, nickname, department, avatar_url")
        .in("id", userIds),
      supabase
        .from("post_media")
        .select("id, post_id, type, url, thumbnail_url, duration, order_index")
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
    usersData.map((user: Pick<UserRow, "id" | "nickname" | "department" | "avatar_url">) => [
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
      thumbnail_url: media.thumbnail_url,
      type: media.type,
      url: media.url,
    });
    mediaByPostId.set(media.post_id, currentMedia);
  });

  const posts: FeedPost[] = slicedPosts.map((post) => {
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
    };
  });

  return {
    nextCursor: hasMore ? posts[posts.length - 1]?.created_at ?? null : null,
    posts,
  };
}

export async function getLikedPostIds(postIds: string[]) {
  if (postIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseMobileClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("post_likes")
    .select("target_id")
    .eq("user_id", user.id)
    .eq("target_type", "post")
    .in("target_id", postIds);

  if (error || !data) {
    throw new Error("좋아요 정보를 불러오지 못했습니다.");
  }

  return data.map((like: Pick<PostLikeRow, "target_id">) => like.target_id);
}

export async function togglePostLike(postId: string) {
  const supabase = getSupabaseMobileClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: existingLike, error: likeSelectError } = await supabase
    .from("post_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", "post")
    .eq("target_id", postId)
    .maybeSingle();

  if (likeSelectError) {
    throw new Error("좋아요 상태를 확인하지 못했습니다.");
  }

  const nextLiked = !existingLike;

  if (existingLike) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("id", existingLike.id);

    if (error) {
      throw new Error("좋아요 취소에 실패했습니다.");
    }
  } else {
    const { error } = await supabase.from("post_likes").insert({
      target_id: postId,
      target_type: "post",
      user_id: user.id,
    });

    if (error) {
      throw new Error("좋아요에 실패했습니다.");
    }
  }

  const { data: likesCount, error: recountError } = await supabase.rpc(
    "recount_post_likes",
    { p_post_id: postId },
  );

  if (recountError || typeof likesCount !== "number") {
    if (existingLike) {
      await supabase.from("post_likes").insert({
        target_id: postId,
        target_type: "post",
        user_id: user.id,
      });
    } else {
      await supabase
        .from("post_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", "post")
        .eq("target_id", postId);
    }

    throw new Error("좋아요 수 업데이트에 실패했습니다.");
  }

  return {
    liked: nextLiked,
    likesCount,
  };
}
