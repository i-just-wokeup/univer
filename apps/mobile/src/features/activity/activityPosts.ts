import { getSupabaseMobileClient } from "../../lib/supabase";
import { getCurrentUserContext } from "../shared/userContext";
import { getActivityPostsByIds } from "./activityPostHydration";
import type {
  ActivityPost,
  BookmarkRow,
  PostLikeRow,
} from "./activityTypes";

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
