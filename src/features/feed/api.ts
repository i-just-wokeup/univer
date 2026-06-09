import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/database.types";
import { getBlockRelatedUserIds } from "@/features/blocks/api";

// 게시물 공개 범위는 현재 MVP 기준 두 가지로 제한한다.
type Visibility = "public" | "close_friends";
type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];
type PostHashtagRow = Database["public"]["Tables"]["post_hashtags"]["Row"];
type HashtagRow = Database["public"]["Tables"]["hashtags"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type PostLikeRow = Database["public"]["Tables"]["post_likes"]["Row"];
type PostLikeInsert = Database["public"]["Tables"]["post_likes"]["Insert"];

// 게시물 작성 시 페이지 레이어에서 조합한 값을 그대로 전달받는다.
type CreatePostParams = {
  content: string;
  hashtags: string[];
  imageUrls: string[];
  universityId: string;
  visibility: Visibility;
};

type UpdatePostParams = {
  content: string;
  hashtags: string[];
  postId: string;
};

// 피드 카드에서 바로 쓰는 미디어 최소 형태.
export type PostMedia = {
  duration: number | null;
  id: string;
  order_index: number;
  thumbnail_url: string | null;
  type: "image" | "video";
  url: string;
};

// 피드 카드에 필요한 작성자 정보만 노출한다.
export type FeedUser = {
  avatar_url: string | null;
  department: string;
  id: string;
  nickname: string;
};

// 피드 렌더링용으로 posts/users/images/hashtags를 조합한 최종 구조.
export type FeedPost = {
  comments_count: number;
  content: string | null;
  created_at: string;
  hashtags: string[];
  id: string;
  media: PostMedia[];
  likes_count: number;
  user: FeedUser;
};

export type GetFeedParams = {
  cursor?: string;
  limit?: number;
};

export type GetFeedResult = {
  nextCursor: string | null;
  posts: FeedPost[];
};

export type PostDetail = {
  comments_count: number;
  content: string | null;
  created_at: string;
  hashtags: string[];
  id: string;
  media: PostMedia[];
  likes_count: number;
  user: FeedUser;
};

export type TogglePostLikeResult = {
  liked: boolean;
  likesCount: number;
};

// 브라우저 환경변수가 없을 때 각 API가 동일한 에러로 빠지도록 통일한다.
function requireSupabaseClient() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  return supabase;
}

// 해시태그는 중복 비교를 위해 # 제거, 공백 제거, 소문자화까지 한 번에 정규화한다.
function normalizeHashtag(tag: string) {
  return tag.trim().replace(/^#+/, "").replace(/\s+/g, "").toLowerCase();
}

// Storage 업로드 경로 생성에 사용할 확장자를 안전하게 추출한다.
function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.at(-1)?.toLowerCase() ?? "jpg" : "jpg";
}

function toPostgrestInFilter(values: string[]) {
  return `(${values.join(",")})`;
}

// 게시물 저장/조회 모두 현재 로그인 유저의 학교 범위를 알아야 하므로 공통으로 분리한다.
export async function getCurrentUserUniversityId() {
  const supabase = requireSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("university_id")
    .eq("id", user.id)
    .maybeSingle();

  if (userError || !userRow?.university_id) {
    throw new Error("현재 로그인 유저의 학교 정보를 찾을 수 없습니다.");
  }

  return {
    universityId: userRow.university_id,
    userId: user.id,
  };
}

// 선택한 이미지를 Supabase Storage에 올리고, DB 저장용 공개 URL만 반환한다.
export async function uploadPostImages(images: File[]) {
  const supabase = requireSupabaseClient();

  const uploadResults = await Promise.all(
    images.map(async (image) => {
      const fileExtension = getFileExtension(image.name);
      const filePath = `posts/${crypto.randomUUID()}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(filePath, image, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error("이미지 업로드에 실패했습니다.");
      }

      const { data } = supabase.storage.from("post-images").getPublicUrl(filePath);
      return data.publicUrl;
    }),
  );

  return uploadResults;
}

async function replacePostHashtags(postId: string, hashtags: string[]) {
  const supabase = requireSupabaseClient();
  const normalizedHashtags = Array.from(
    new Set(hashtags.map(normalizeHashtag).filter(Boolean)),
  );

  const { error: deleteError } = await supabase
    .from("post_hashtags")
    .delete()
    .eq("post_id", postId);

  if (deleteError) {
    throw new Error("기존 해시태그 연결을 정리하지 못했습니다.");
  }

  if (normalizedHashtags.length === 0) {
    return;
  }

  const { error: hashtagsUpsertError } = await supabase
    .from("hashtags")
    .upsert(
      normalizedHashtags.map((name) => ({ name })),
      {
        onConflict: "name",
      },
    );

  if (hashtagsUpsertError) {
    throw new Error("해시태그 저장에 실패했습니다.");
  }

  const { data: hashtagRows, error: hashtagsSelectError } = await supabase
    .from("hashtags")
    .select("id, name")
    .in("name", normalizedHashtags);

  if (hashtagsSelectError || !hashtagRows) {
    throw new Error("해시태그 정보를 불러오지 못했습니다.");
  }

  const { error: postHashtagsError } = await supabase
    .from("post_hashtags")
    .insert(
      hashtagRows.map((hashtag) => ({
        hashtag_id: hashtag.id,
        post_id: postId,
      })),
    );

  if (postHashtagsError) {
    throw new Error("게시물 해시태그 연결에 실패했습니다.");
  }
}

// 게시물 본문, 이미지, 해시태그를 posts 관련 테이블에 순서대로 저장한다.
export async function createPost({
  content,
  hashtags,
  imageUrls,
  universityId,
  visibility,
}: CreatePostParams) {
  const supabase = requireSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const trimmedContent = content.trim();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      content: trimmedContent.length > 0 ? trimmedContent : null,
      university_id: universityId,
      user_id: user.id,
      visibility,
    })
    .select("id")
    .single();

  if (postError || !post) {
    throw new Error("게시물 저장에 실패했습니다.");
  }

  if (imageUrls.length > 0) {
    const { error: postMediaError } = await supabase.from("post_media").insert(
      imageUrls.map((url, index) => ({
        order_index: index,
        post_id: post.id,
        type: "image" as const,
        url,
      })),
    );

    if (postMediaError) {
      throw new Error("게시물 미디어 저장에 실패했습니다.");
    }
  }

  await replacePostHashtags(post.id, hashtags);

  return post.id;
}

// 수정 화면과 상세 화면에서 필요한 게시물 정보를 조회한다.
export async function getPost(postId: string): Promise<PostDetail> {
  const supabase = requireSupabaseClient();
  const blockRelatedUserIds = await getBlockRelatedUserIds();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, content, created_at, likes_count, comments_count, user_id")
    .eq("id", postId)
    .is("deleted_at", null)
    .single();

  if (postError || !post) {
    throw new Error("게시물을 찾을 수 없습니다.");
  }

  if (blockRelatedUserIds.includes(post.user_id)) {
    throw new Error("게시물을 찾을 수 없습니다.");
  }

  const [
    { data: mediaData, error: mediaError },
    { data: postHashtagsData, error: postHashtagsError },
    { data: userData, error: userError },
  ] =
    await Promise.all([
      supabase
        .from("post_media")
        .select("id, post_id, type, url, thumbnail_url, duration, order_index, created_at")
        .eq("post_id", postId)
        .order("order_index", { ascending: true }),
      supabase
        .from("post_hashtags")
        .select("post_id, hashtag_id")
        .eq("post_id", postId),
      supabase
        .from("users")
        .select("id, nickname, department, avatar_url")
        .eq("id", post.user_id)
        .single(),
    ]);

  if (mediaError || !mediaData) {
    throw new Error("게시물 미디어를 불러오지 못했습니다.");
  }

  if (postHashtagsError || !postHashtagsData) {
    throw new Error("게시물 해시태그를 불러오지 못했습니다.");
  }

  if (userError || !userData) {
    throw new Error("게시물 작성자 정보를 불러오지 못했습니다.");
  }

  const hashtagIds = postHashtagsData.map((postHashtag) => postHashtag.hashtag_id);
  let hashtags: string[] = [];

  if (hashtagIds.length > 0) {
    const { data: hashtagsData, error: hashtagsError } = await supabase
      .from("hashtags")
      .select("id, name")
      .in("id", hashtagIds);

    if (hashtagsError || !hashtagsData) {
      throw new Error("해시태그 정보를 불러오지 못했습니다.");
    }

    const hashtagsById = new Map(
      hashtagsData.map((hashtag: Pick<HashtagRow, "id" | "name">) => [
        hashtag.id,
        hashtag.name,
      ]),
    );

    hashtags = postHashtagsData
      .map((postHashtag) => hashtagsById.get(postHashtag.hashtag_id))
      .filter((hashtag): hashtag is string => Boolean(hashtag));
  }

  return {
    comments_count: post.comments_count,
    content: post.content,
    created_at: post.created_at,
    hashtags,
    id: post.id,
    media: mediaData.map((media: PostMediaRow) => ({
      duration: media.duration,
      id: media.id,
      order_index: media.order_index,
      thumbnail_url: media.thumbnail_url,
      type: media.type,
      url: media.url,
    })),
    likes_count: post.likes_count,
    user: {
      avatar_url: userData.avatar_url,
      department: userData.department,
      id: userData.id,
      nickname: userData.nickname,
    },
  };
}

// 본인 게시물의 본문과 해시태그만 수정한다. 이미지는 수정 모드에서 변경하지 않는다.
export async function updatePost({
  content,
  hashtags,
  postId,
}: UpdatePostParams): Promise<void> {
  const supabase = requireSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, user_id")
    .eq("id", postId)
    .is("deleted_at", null)
    .single();

  if (postError || !post) {
    throw new Error("게시물을 찾을 수 없습니다.");
  }

  if (post.user_id !== user.id) {
    throw new Error("본인 게시물만 수정할 수 있습니다.");
  }

  const trimmedContent = content.trim();
  const { error: updateError } = await supabase
    .from("posts")
    .update({ content: trimmedContent.length > 0 ? trimmedContent : null })
    .eq("id", post.id);

  if (updateError) {
    throw new Error("게시물 수정에 실패했습니다.");
  }

  await replacePostHashtags(post.id, hashtags);
}

// 본인 게시물만 deleted_at을 갱신해 피드에서 숨긴다.
export async function deletePost(postId: string): Promise<void> {
  const supabase = requireSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, user_id")
    .eq("id", postId)
    .maybeSingle();

  if (postError || !post) {
    throw new Error("게시물을 찾을 수 없습니다.");
  }

  if (post.user_id !== user.id) {
    throw new Error("본인 게시물만 삭제할 수 있습니다.");
  }

  const { error: deleteError } = await supabase
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", post.id);

  if (deleteError) {
    throw new Error("게시물 삭제에 실패했습니다.");
  }
}

// 현재 로그인 유저가 좋아요한 게시물 id만 골라 UI 초기 상태에 사용한다.
export async function getLikedPostIds(postIds: string[]) {
  if (postIds.length === 0) {
    return [];
  }

  const supabase = requireSupabaseClient();
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

// 게시물 좋아요 레코드와 posts.likes_count를 함께 갱신한다.
export async function togglePostLike(postId: string): Promise<TogglePostLikeResult> {
  const supabase = requireSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, likes_count")
    .eq("id", postId)
    .is("deleted_at", null)
    .single();

  if (postError || !post) {
    throw new Error("게시물을 찾을 수 없습니다.");
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
  const nextLikesCount = Math.max(
    0,
    post.likes_count + (nextLiked ? 1 : -1),
  );

  if (existingLike) {
    const { error: deleteError } = await supabase
      .from("post_likes")
      .delete()
      .eq("id", existingLike.id);

    if (deleteError) {
      throw new Error("좋아요 취소에 실패했습니다.");
    }
  } else {
    const postLikeInsert: PostLikeInsert = {
      target_id: postId,
      target_type: "post",
      user_id: user.id,
    };

    const { error: insertError } = await supabase
      .from("post_likes")
      .insert(postLikeInsert);

    if (insertError) {
      throw new Error("좋아요에 실패했습니다.");
    }
  }

  const { data: updatedPost, error: updateError } = await supabase
    .from("posts")
    .update({ likes_count: nextLikesCount })
    .eq("id", postId)
    .select("likes_count")
    .single();

  if (updateError || !updatedPost) {
    throw new Error("좋아요 수 업데이트에 실패했습니다.");
  }

  return {
    liked: nextLiked,
    likesCount: updatedPost.likes_count,
  };
}

// 같은 학교 게시물만 최신순으로 불러오고, 피드 카드에 필요한 조인 데이터를 조립한다.
export async function getFeed({
  cursor,
  limit = 20,
}: GetFeedParams = {}): Promise<GetFeedResult> {
  const supabase = requireSupabaseClient();
  const { universityId } = await getCurrentUserUniversityId();
  const blockRelatedUserIds = await getBlockRelatedUserIds();
  const fetchLimit = limit + 1;

  let postsQuery = supabase
    .from("posts")
    .select(
      "id, content, created_at, likes_count, comments_count, user_id, university_id, visibility, deleted_at, views_count",
    )
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

  if (postsError) {
    throw new Error("피드를 불러오지 못했습니다.");
  }

  // 커서 기반 다음 페이지 계산을 위해 한 개 더 가져온다.
  const hasMore = postsData.length > limit;
  const slicedPosts = hasMore ? postsData.slice(0, limit) : postsData;

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
        .select("id, post_id, type, url, thumbnail_url, duration, order_index, created_at")
        .in("post_id", postIds)
        .order("order_index", { ascending: true }),
    ]);

  if (usersError || !usersData) {
    throw new Error("작성자 정보를 불러오지 못했습니다.");
  }

  if (mediaError || !mediaData) {
    throw new Error("게시물 미디어를 불러오지 못했습니다.");
  }

  // 해시태그는 연결 테이블과 실제 이름 테이블을 나눠서 읽어야 한다.
  const {
    data: postHashtagsData,
    error: postHashtagsError,
  } = await supabase
    .from("post_hashtags")
    .select("post_id, hashtag_id")
    .in("post_id", postIds);

  if (postHashtagsError || !postHashtagsData) {
    throw new Error("게시물 해시태그를 불러오지 못했습니다.");
  }

  const hashtagIds = Array.from(
    new Set(postHashtagsData.map((postHashtag) => postHashtag.hashtag_id)),
  );

  let hashtagsData: HashtagRow[] = [];

  if (hashtagIds.length > 0) {
    const { data, error } = await supabase
      .from("hashtags")
      .select("id, name, created_at")
      .in("id", hashtagIds);

    if (error || !data) {
      throw new Error("해시태그 정보를 불러오지 못했습니다.");
    }

    hashtagsData = data;
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

  mediaData.forEach((media: PostMediaRow) => {
    // 쿼리 정렬을 그대로 유지한 채 post_id별 배열만 묶는다.
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

  const hashtagsById = new Map<string, string>(
    hashtagsData.map((hashtag: HashtagRow) => [hashtag.id, hashtag.name]),
  );

  const hashtagsByPostId = new Map<string, string[]>();

  postHashtagsData.forEach((postHashtag: PostHashtagRow) => {
    const hashtagName = hashtagsById.get(postHashtag.hashtag_id);

    if (!hashtagName) {
      return;
    }

    const currentHashtags = hashtagsByPostId.get(postHashtag.post_id) ?? [];
    currentHashtags.push(hashtagName);
    hashtagsByPostId.set(postHashtag.post_id, currentHashtags);
  });

  // 최종 반환 시 UI가 바로 렌더링할 수 있는 FeedPost 구조로 평탄화한다.
  const posts: FeedPost[] = slicedPosts.map((post: PostRow) => {
    const user = usersById.get(post.user_id);

    if (!user) {
      throw new Error("게시물 작성자 정보를 찾을 수 없습니다.");
    }

    return {
      comments_count: post.comments_count,
      content: post.content,
      created_at: post.created_at,
      hashtags: hashtagsByPostId.get(post.id) ?? [],
      id: post.id,
      media: mediaByPostId.get(post.id) ?? [],
      likes_count: post.likes_count,
      user,
    };
  });

  return {
    nextCursor: hasMore ? posts[posts.length - 1]?.created_at ?? null : null,
    posts,
  };
}
