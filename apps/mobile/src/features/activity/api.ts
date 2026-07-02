// 내 활동 데이터 계층 — 내 스토리 보관함/조회자, 저장·좋아요·댓글 단 게시물, 즐겨찾기 계정.
import type { Database } from "../../types/database.types";
import { getSupabaseMobileClient } from "../../lib/supabase";
import {
  getBlockRelatedUserIds,
  getCurrentUserContext,
} from "../shared/userContext";

type BookmarkRow = Database["public"]["Tables"]["bookmarks"]["Row"];
type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];
type PostLikeRow = Database["public"]["Tables"]["post_likes"]["Row"];
type StoryViewRow = Database["public"]["Tables"]["story_views"]["Row"];
type StoryRow = Database["public"]["Tables"]["stories"]["Row"];
type UserFavoriteRow = Database["public"]["Tables"]["user_favorites"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type ActivityStory = Pick<
  StoryRow,
  | "created_at"
  | "expires_at"
  | "id"
  | "image_url"
  | "is_archived"
  | "processing_status"
  | "thumbnail_url"
  | "type"
  | "visibility"
  | "views_count"
>;

export type ActivityPostMedia = Pick<
  PostMediaRow,
  "id" | "order_index" | "thumbnail_url" | "type" | "url"
>;

export type ActivityPost = Pick<
  PostRow,
  "comments_count" | "content" | "created_at" | "id" | "likes_count"
> & {
  media: ActivityPostMedia[];
  saved_at?: string;
  user: Pick<UserRow, "avatar_url" | "department" | "id" | "nickname">;
};

export type ActivityStoryViewer = Pick<
  UserRow,
  "avatar_url" | "id" | "nickname"
> & {
  isLiked: boolean;
  viewed_at: string;
};

export type ActivityFavoriteUser = Pick<
  UserRow,
  "avatar_url" | "department" | "id" | "nickname"
> & {
  favorited_at: string;
};

// 게시물 id 목록 → ActivityPost[] (미디어/작성자 합침). 입력 id 순서를 유지하고,
// savedAtByPostId가 있으면 각 게시물의 저장/좋아요/댓글 시각을 saved_at으로 주입한다.
// 저장/좋아요/댓글 탭이 공용으로 쓰는 헬퍼.
async function getActivityPostsByIds(
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

  // 차단한(또는 나를 차단한) 유저의 게시물은 내 활동 목록에서 숨긴다.
  // 좋아요/저장/댓글 기록 자체는 지우지 않음 → 언블락하면 다시 보인다.
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

// 내가 올린 스토리 보관함(삭제 제외, 최신순).
export async function getMyStories(): Promise<ActivityStory[]> {
  const supabase = getSupabaseMobileClient();
  const { userId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("stories")
    .select(
      "id, image_url, type, thumbnail_url, processing_status, views_count, expires_at, is_archived, visibility, created_at",
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error("스토리 보관함을 불러오지 못했습니다.");
  }

  return data;
}

// 내 스토리 조회자 목록(최신순) + 각자의 좋아요 여부. 본인 스토리만 조회 가능.
export async function getActivityStoryViewers(
  storyId: string,
): Promise<ActivityStoryViewer[]> {
  const supabase = getSupabaseMobileClient();
  const { userId } = await getCurrentUserContext();

  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("id")
    .eq("id", storyId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (storyError || !story) {
    throw new Error("스토리 정보를 불러오지 못했습니다.");
  }

  const { data: storyViews, error: viewsError } = await supabase
    .from("story_views")
    .select("user_id, created_at")
    .eq("story_id", storyId)
    .order("created_at", { ascending: false });

  if (viewsError || !storyViews) {
    throw new Error("스토리 조회자 목록을 불러오지 못했습니다.");
  }

  if (storyViews.length === 0) {
    return [];
  }

  const viewerIds = storyViews.map(
    (view: Pick<StoryViewRow, "user_id">) => view.user_id,
  );
  const [
    { data: users, error: usersError },
    { data: storyLikes, error: likesError },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, nickname, avatar_url")
      .in("id", viewerIds),
    supabase
      .from("post_likes")
      .select("user_id")
      .eq("target_type", "story")
      .eq("target_id", storyId)
      .in("user_id", viewerIds),
  ]);

  if (usersError || !users) {
    throw new Error("스토리 조회자 정보를 불러오지 못했습니다.");
  }

  if (likesError || !storyLikes) {
    throw new Error("스토리 좋아요 정보를 불러오지 못했습니다.");
  }

  const usersById = new Map(
    users.map((user) => [
      user.id,
      {
        avatar_url: user.avatar_url,
        id: user.id,
        nickname: user.nickname,
      },
    ]),
  );
  const likedViewerIds = new Set(
    storyLikes.map((like: Pick<PostLikeRow, "user_id">) => like.user_id),
  );

  return storyViews.reduce<ActivityStoryViewer[]>((viewers, view) => {
    const user = usersById.get(view.user_id);

    if (!user) {
      return viewers;
    }

    viewers.push({
      ...user,
      isLiked: likedViewerIds.has(user.id),
      viewed_at: view.created_at,
    });

    return viewers;
  }, []);
}

// 저장(북마크)한 게시물 목록(저장 시각 순).
export async function getSavedPosts(): Promise<ActivityPost[]> {
  const supabase = getSupabaseMobileClient();
  const { userId } = await getCurrentUserContext();

  const { data: bookmarks, error } = await supabase
    .from("bookmarks")
    .select("post_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !bookmarks) {
    throw new Error("저장한 게시물을 불러오지 못했습니다.");
  }

  const postIds = bookmarks.map(
    (bookmark: Pick<BookmarkRow, "post_id">) => bookmark.post_id,
  );
  const savedAtByPostId = new Map(
    bookmarks.map((bookmark: Pick<BookmarkRow, "created_at" | "post_id">) => [
      bookmark.post_id,
      bookmark.created_at,
    ]),
  );

  return getActivityPostsByIds(postIds, savedAtByPostId);
}

// 좋아요한 게시물 목록(좋아요 시각 순).
export async function getLikedPosts(): Promise<ActivityPost[]> {
  const supabase = getSupabaseMobileClient();
  const { userId } = await getCurrentUserContext();

  const { data: likes, error } = await supabase
    .from("post_likes")
    .select("target_id, created_at")
    .eq("user_id", userId)
    .eq("target_type", "post")
    .order("created_at", { ascending: false });

  if (error || !likes) {
    throw new Error("좋아요한 게시물을 불러오지 못했습니다.");
  }

  const postIds = likes.map(
    (like: Pick<PostLikeRow, "target_id">) => like.target_id,
  );
  const likedAtByPostId = new Map(
    likes.map((like: Pick<PostLikeRow, "created_at" | "target_id">) => [
      like.target_id,
      like.created_at,
    ]),
  );

  return getActivityPostsByIds(postIds, likedAtByPostId);
}

// 댓글 단 게시물 목록(게시물당 1회, 가장 최근 댓글 시각 순).
export async function getCommentedPosts(): Promise<ActivityPost[]> {
  const supabase = getSupabaseMobileClient();
  const { userId } = await getCurrentUserContext();

  const { data: comments, error } = await supabase
    .from("comments")
    .select("post_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !comments) {
    throw new Error("댓글 단 게시물을 불러오지 못했습니다.");
  }

  const commentedAtByPostId = new Map<string, string>();
  const postIds = comments.reduce<string[]>((ids, comment) => {
    if (commentedAtByPostId.has(comment.post_id)) {
      return ids;
    }

    ids.push(comment.post_id);
    commentedAtByPostId.set(comment.post_id, comment.created_at);
    return ids;
  }, []);

  return getActivityPostsByIds(postIds, commentedAtByPostId);
}

// 즐겨찾기한 계정 목록(같은 학교·미삭제만, 즐겨찾기 시각 순).
export async function getFavoriteUsers(): Promise<ActivityFavoriteUser[]> {
  const supabase = getSupabaseMobileClient();
  const { universityId, userId } = await getCurrentUserContext();

  const { data: favorites, error } = await supabase
    .from("user_favorites")
    .select("favorite_user_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !favorites) {
    throw new Error("즐겨찾기 계정을 불러오지 못했습니다.");
  }

  if (favorites.length === 0) {
    return [];
  }

  const favoriteUserIds = favorites.map(
    (favorite: Pick<UserFavoriteRow, "favorite_user_id">) =>
      favorite.favorite_user_id,
  );
  const favoritedAtByUserId = new Map(
    favorites.map(
      (favorite: Pick<UserFavoriteRow, "created_at" | "favorite_user_id">) => [
        favorite.favorite_user_id,
        favorite.created_at,
      ],
    ),
  );

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, nickname, department, avatar_url")
    .eq("university_id", universityId)
    .is("deleted_at", null)
    .in("id", favoriteUserIds);

  if (usersError || !users) {
    throw new Error("즐겨찾기 계정 정보를 불러오지 못했습니다.");
  }

  const usersById = new Map(users.map((user) => [user.id, user]));

  return favoriteUserIds.reduce<ActivityFavoriteUser[]>((items, userId) => {
    const user = usersById.get(userId);
    const favoritedAt = favoritedAtByUserId.get(userId);

    if (!user || !favoritedAt) {
      return items;
    }

    items.push({
      avatar_url: user.avatar_url,
      department: user.department,
      favorited_at: favoritedAt,
      id: user.id,
      nickname: user.nickname,
    });

    return items;
  }, []);
}
