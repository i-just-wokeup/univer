import { getSupabaseMobileClient } from "../../lib/supabase";
import type { BookmarkRow, PostCounts, PostLikeRow, PostRow } from "./internalTypes";

async function requireCurrentUserId(): Promise<string> {
  const supabase = getSupabaseMobileClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  return user.id;
}

// 주어진 게시물들 중 현재 유저가 좋아요한 id 목록.
export async function getLikedPostIds(postIds: string[]) {
  if (postIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseMobileClient();
  const userId = await requireCurrentUserId();

  const { data, error } = await supabase
    .from("post_likes")
    .select("target_id")
    .eq("user_id", userId)
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
  const userId = await requireCurrentUserId();

  const { data, error } = await supabase
    .from("bookmarks")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  if (error || !data) {
    throw new Error("저장 정보를 불러오지 못했습니다.");
  }

  return data.map((bookmark: Pick<BookmarkRow, "post_id">) => bookmark.post_id);
}

// 목록 화면 복귀 시 좋아요/댓글 수만 가볍게 재조회한다. 없는 id는 삭제된 글로 볼 수 있다.
export async function getPostCounts(postIds: string[]): Promise<PostCounts[]> {
  if (postIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, likes_count, comments_count")
    .is("deleted_at", null)
    .in("id", postIds);

  if (error || !data) {
    throw new Error("게시물 정보를 불러오지 못했습니다.");
  }

  return data.map(
    (row: Pick<PostRow, "id" | "likes_count" | "comments_count">) => ({
      comments_count: row.comments_count,
      id: row.id,
      likes_count: row.likes_count,
    }),
  );
}

// 게시물 저장/저장취소 토글 → { bookmarked }.
export async function toggleBookmark(postId: string) {
  const supabase = getSupabaseMobileClient();
  const userId = await requireCurrentUserId();

  const { data: existingBookmark, error: selectError } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
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
    user_id: userId,
  });

  if (error) {
    throw new Error("게시물 저장에 실패했습니다.");
  }

  return { bookmarked: true };
}

// 좋아요 수는 직접 UPDATE하지 않고 recount_post_likes RPC 결과만 신뢰한다.
export async function togglePostLike(postId: string) {
  const supabase = getSupabaseMobileClient();
  const userId = await requireCurrentUserId();

  const { data: existingLike, error: likeSelectError } = await supabase
    .from("post_likes")
    .select("id")
    .eq("user_id", userId)
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
      user_id: userId,
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
        user_id: userId,
      });
    } else {
      await supabase
        .from("post_likes")
        .delete()
        .eq("user_id", userId)
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
