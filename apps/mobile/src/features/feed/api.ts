import type { Database } from "../../types/database.types";
import { PAGE_SIZE } from "../../lib/constants/pagination";
import { STORAGE_BUCKETS, STORAGE_FOLDERS } from "../../lib/constants/storage";
import { getSupabaseMobileClient } from "../../lib/supabase";
import { uploadImagesToBucket } from "../shared/imageUpload";
import {
  getBlockRelatedUserIds,
  getCurrentUserContext,
} from "../shared/userContext";
import type {
  FeedPost,
  FeedUser,
  GetFeedResult,
  PostAspectRatio,
  PostMedia,
  PostVisibility,
} from "./types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type PostLikeRow = Database["public"]["Tables"]["post_likes"]["Row"];
type BookmarkRow = Database["public"]["Tables"]["bookmarks"]["Row"];

type FeedPostRow = Pick<
  PostRow,
  "comments_count" | "content" | "created_at" | "id" | "likes_count" | "user_id"
> & {
  aspect_ratio?: PostAspectRatio;
};

type CreatePostParams = {
  aspectRatio: PostAspectRatio;
  content: string;
  imageUrls: string[];
  visibility: PostVisibility;
};

function toPostgrestInFilter(values: string[]) {
  return `(${values.join(",")})`;
}

export async function uploadPostImages(uris: string[]): Promise<string[]> {
  return uploadImagesToBucket(
    STORAGE_BUCKETS.postImages,
    STORAGE_FOLDERS.posts,
    uris,
    1600,
  );
}

export async function createPost({
  aspectRatio,
  content,
  imageUrls,
  visibility,
}: CreatePostParams): Promise<string> {
  const supabase = getSupabaseMobileClient();
  const { universityId, userId } = await getCurrentUserContext();
  const trimmedContent = content.trim();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      aspect_ratio: aspectRatio,
      content: trimmedContent || null,
      university_id: universityId,
      user_id: userId,
      visibility,
    })
    .select("id")
    .single();

  if (postError || !post) {
    throw new Error("게시물 작성에 실패했습니다.");
  }

  if (imageUrls.length > 0) {
    const { error: mediaError } = await supabase.from("post_media").insert(
      imageUrls.map((url, index) => ({
        order_index: index,
        post_id: post.id,
        type: "image" as const,
        url,
      })),
    );

    if (mediaError) {
      throw new Error("게시물 이미지를 저장하지 못했습니다.");
    }
  }

  return post.id;
}

export async function deletePost(postId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const { userId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error("게시물 삭제에 실패했습니다.");
  }
}

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

export async function getBookmarkedPostIds(postIds: string[]) {
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
    .from("bookmarks")
    .select("post_id")
    .eq("user_id", user.id)
    .in("post_id", postIds);

  if (error || !data) {
    throw new Error("저장 정보를 불러오지 못했습니다.");
  }

  return data.map((bookmark: Pick<BookmarkRow, "post_id">) => bookmark.post_id);
}

export async function toggleBookmark(postId: string) {
  const supabase = getSupabaseMobileClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: existingBookmark, error: selectError } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (selectError) {
    throw new Error("저장 상태를 확인하지 못했습니다.");
  }

  if (existingBookmark) {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", existingBookmark.id);

    if (error) {
      throw new Error("저장 취소에 실패했습니다.");
    }

    return { bookmarked: false };
  }

  const { error } = await supabase.from("bookmarks").insert({
    post_id: postId,
    user_id: user.id,
  });

  if (error) {
    throw new Error("게시물 저장에 실패했습니다.");
  }

  return { bookmarked: true };
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

// 단일 게시물 상세 조회. 차단 유저/삭제 제외, FeedPost 형태로 반환해 FeedPostCard가 그대로 받게 한다.
export async function getPost(postId: string): Promise<FeedPost> {
  const supabase = getSupabaseMobileClient();
  const blockRelatedUserIds = await getBlockRelatedUserIds();

  const { data: postData, error: postError } = await supabase
    .from("posts")
    .select("id, aspect_ratio, content, created_at, likes_count, comments_count, user_id")
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

  const [
    { data: userData, error: userError },
    { data: mediaData, error: mediaError },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, nickname, department, avatar_url")
      .eq("id", post.user_id)
      .maybeSingle(),
    supabase
      .from("post_media")
      .select("id, post_id, type, url, thumbnail_url, duration, order_index")
      .eq("post_id", postId)
      .order("order_index", { ascending: true }),
  ]);

  if (userError || !userData) {
    throw new Error("작성자 정보를 불러오지 못했습니다.");
  }

  if (mediaError || !mediaData) {
    throw new Error("게시물 미디어를 불러오지 못했습니다.");
  }

  const userRow = userData as Pick<
    UserRow,
    "avatar_url" | "department" | "id" | "nickname"
  >;
  const user: FeedUser = {
    avatar_url: userRow.avatar_url,
    department: userRow.department,
    id: userRow.id,
    nickname: userRow.nickname,
  };

  const media: PostMedia[] = (mediaData as PostMediaRow[]).map((mediaItem) => ({
    duration: mediaItem.duration,
    id: mediaItem.id,
    order_index: mediaItem.order_index,
    thumbnail_url: mediaItem.thumbnail_url,
    type: mediaItem.type,
    url: mediaItem.url,
  }));

  return {
    aspect_ratio: post.aspect_ratio ?? "portrait",
    comments_count: post.comments_count,
    content: post.content,
    created_at: post.created_at,
    id: post.id,
    likes_count: post.likes_count,
    media,
    user,
  };
}
