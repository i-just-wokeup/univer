// 피드/게시물 데이터 계층 — 피드 조회·게시물 작성/삭제·좋아요·저장(북마크)·이미지 업로드.
// 모든 Supabase 쿼리는 features/*/api.ts 에서만 (CLAUDE.md 규칙).
import type { Database } from "../../types/database.types";
import { PAGE_SIZE } from "../../lib/constants/pagination";
import { STORAGE_BUCKETS, STORAGE_FOLDERS } from "../../lib/constants/storage";
import { getSupabaseMobileClient } from "../../lib/supabase";
import { uploadImagesToBucket } from "../shared/imageUpload";
import {
  uploadVideoToCloudflareStream,
  type CloudflareStreamUploadResult,
} from "../shared/streamUpload";
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

// 게시물은 사진 여러 장 OR 영상 1개(섞지 않음, 인스타식). video가 있으면 영상 게시물.
type CreatePostVideo = {
  assetId: string;
  durationSeconds: number | null;
  provider: "cloudflare_stream";
  status: "processing";
  thumbnailUrl: string | null;
  url: string;
};

type CreatePostParams = {
  aspectRatio: PostAspectRatio;
  content: string;
  imageUrls: string[];
  video?: CreatePostVideo | null;
  visibility: PostVisibility;
};

// PostgREST `in` 필터용 문자열로 변환: ["a","b"] → "(a,b)".
function toPostgrestInFilter(values: string[]) {
  return `(${values.join(",")})`;
}

// 게시물 이미지들을 post-images 버킷에 업로드(1600px 리사이즈) → 공개 URL 배열.
export async function uploadPostImages(uris: string[]): Promise<string[]> {
  return uploadImagesToBucket(
    STORAGE_BUCKETS.postImages,
    STORAGE_FOLDERS.posts,
    uris,
    1600,
  );
}

// 게시물 영상을 Cloudflare Stream에 직접 업로드하고 HLS 재생 URL/asset id를 반환한다.
export async function uploadPostVideo(
  uri: string,
): Promise<CloudflareStreamUploadResult> {
  return uploadVideoToCloudflareStream(uri);
}

// 게시물 작성. posts insert 후 미디어(영상 1개 OR 이미지 여러 장)를 post_media에 넣는다. 새 postId 반환.
export async function createPost({
  aspectRatio,
  content,
  imageUrls,
  video,
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

  if (video) {
    // 영상 게시물: post_media에 영상 1개(type=video, 포스터/길이 포함).
    const { error: mediaError } = await supabase.from("post_media").insert({
      duration: video.durationSeconds,
      order_index: 0,
      post_id: post.id,
      processing_status: video.status,
      provider: video.provider,
      provider_asset_id: video.assetId,
      thumbnail_url: video.thumbnailUrl,
      type: "video" as const,
      url: video.url,
    });

    if (mediaError) {
      throw new Error("게시물 영상을 저장하지 못했습니다.");
    }
  } else if (imageUrls.length > 0) {
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

// 본인 글 soft delete(deleted_at 기록). user_id 일치 + 미삭제만, 결과 없으면 실패 처리.
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

// 홈 피드 조회. 같은 학교 + 차단 관계 제외, created_at cursor 무한스크롤.
// limit+1개를 가져와 다음 페이지 유무를 판단하고, 작성자/미디어는 별도 조회해 합친다.
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
        .select("id, post_id, type, url, thumbnail_url, duration, order_index, provider, provider_asset_id, processing_status")
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
      processing_status: media.processing_status,
      provider: media.provider,
      provider_asset_id: media.provider_asset_id,
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

// 영상 전용 피드(릴스). getFeed와 동일하되 post_media에 영상이 있는 게시물만(inner join 필터).
export async function getVideoFeed({
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
    .select(
      "id, aspect_ratio, content, created_at, likes_count, comments_count, user_id, post_media!inner(type)",
    )
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
  }

  const { data: postsData, error: postsError } = await postsQuery;

  if (postsError || !postsData) {
    throw new Error("영상을 불러오지 못했습니다.");
  }

  const normalizedPosts = postsData as unknown as FeedPostRow[];
  const hasMore = normalizedPosts.length > limit;
  const slicedPosts = hasMore ? normalizedPosts.slice(0, limit) : normalizedPosts;

  if (slicedPosts.length === 0) {
    return { nextCursor: null, posts: [] };
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
        .select("id, post_id, type, url, thumbnail_url, duration, order_index, provider, provider_asset_id, processing_status")
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
      processing_status: media.processing_status,
      provider: media.provider,
      provider_asset_id: media.provider_asset_id,
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

// 주어진 게시물들 중 현재 유저가 좋아요한 id 목록.
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

// 주어진 게시물들 중 현재 유저가 저장(북마크)한 id 목록.
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

// 게시물 저장/저장취소 토글 → { bookmarked }.
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

// 게시물 좋아요 토글 + recount_post_likes RPC로 likes_count 재계산. RPC 실패 시 insert/delete 롤백.
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
      .select("id, post_id, type, url, thumbnail_url, duration, order_index, provider, provider_asset_id, processing_status")
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
    processing_status: mediaItem.processing_status,
    provider: mediaItem.provider,
    provider_asset_id: mediaItem.provider_asset_id,
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
