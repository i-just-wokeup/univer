// 댓글 데이터 계층 — 댓글/대댓글 조회·작성·삭제, 댓글 좋아요.
// 댓글 수는 원댓글만 recount_post_comments RPC로 반영(대댓글 제외).
import type { Database } from "../../types/database.types";
import { getSupabaseMobileClient } from "../../lib/supabase";
import { getBlockRelatedUserIds } from "../shared/userContext";
import type { Comment, CommentUser } from "./types";

type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type CommentLikeRow = Database["public"]["Tables"]["comment_likes"]["Row"];
type CommentLikeInsert = Database["public"]["Tables"]["comment_likes"]["Insert"];

// DB 행 + 작성자 → 화면용 Comment(빈 replies 포함)로 변환.
function toComment(comment: CommentRow, user: CommentUser): Comment {
  return {
    content: comment.content,
    created_at: comment.created_at,
    id: comment.id,
    likes_count: comment.likes_count,
    parent_id: comment.parent_id,
    replies: [],
    user,
  };
}

// 유저 id들 → { id → CommentUser } 맵 (중복 제거 후 한 번에 조회).
async function getUsersById(userIds: string[]) {
  const supabase = getSupabaseMobileClient();
  const uniqueUserIds = Array.from(new Set(userIds));

  if (uniqueUserIds.length === 0) {
    return new Map<string, CommentUser>();
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, nickname, avatar_url")
    .in("id", uniqueUserIds);

  if (error || !data) {
    throw new Error("댓글 작성자 정보를 불러오지 못했습니다.");
  }

  return new Map<string, CommentUser>(
    data.map((user: Pick<UserRow, "avatar_url" | "id" | "nickname">) => [
      user.id,
      {
        avatar_url: user.avatar_url,
        id: user.id,
        nickname: user.nickname,
      },
    ]),
  );
}

// 평평한 댓글 목록을 트리로: 원댓글은 최신순, 각 원댓글의 대댓글은 오래된순으로 묶는다.
function buildCommentTree(comments: Comment[]) {
  const parentComments = comments
    .filter((comment) => comment.parent_id === null)
    .sort(
      (leftComment, rightComment) =>
        new Date(rightComment.created_at).getTime() -
        new Date(leftComment.created_at).getTime(),
    );

  const repliesByParentId = new Map<string, Comment[]>();

  comments
    .filter((comment) => comment.parent_id !== null)
    .sort(
      (leftComment, rightComment) =>
        new Date(leftComment.created_at).getTime() -
        new Date(rightComment.created_at).getTime(),
    )
    .forEach((reply) => {
      if (!reply.parent_id) {
        return;
      }

      const currentReplies = repliesByParentId.get(reply.parent_id) ?? [];
      currentReplies.push(reply);
      repliesByParentId.set(reply.parent_id, currentReplies);
    });

  return parentComments.map((comment) => ({
    ...comment,
    replies: repliesByParentId.get(comment.id) ?? [],
  }));
}

// 현재 로그인 유저 id(없으면 null) — 댓글 본인 여부 판정용.
export async function getCurrentCommentUserId() {
  const supabase = getSupabaseMobileClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user.id;
}

// 게시물 댓글을 트리(원댓글+대댓글)로 조회. 작성자 정보를 별도 조회해 합친다.
export async function getComments(postId: string): Promise<Comment[]> {
  const supabase = getSupabaseMobileClient();

  const [{ data, error }, blockRelatedUserIds] = await Promise.all([
    supabase
      .from("comments")
      .select("id, user_id, post_id, parent_id, content, likes_count, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: false }),
    getBlockRelatedUserIds(),
  ]);

  if (error || !data) {
    throw new Error("댓글을 불러오지 못했습니다.");
  }

  // 차단 관계(내가 차단 + 나를 차단) 유저의 댓글·대댓글은 목록에서 제외한다.
  // 원댓글이 빠지면 buildCommentTree에서 그 하위 대댓글도 자연히 사라진다.
  const blockedUserIds = new Set(blockRelatedUserIds);
  const comments = (data as CommentRow[]).filter(
    (comment) => !blockedUserIds.has(comment.user_id),
  );

  const usersById = await getUsersById(comments.map((comment) => comment.user_id));

  return buildCommentTree(
    comments.map((comment) => {
      const user = usersById.get(comment.user_id);

      if (!user) {
        throw new Error("댓글 작성자 정보를 찾을 수 없습니다.");
      }

      return toComment(comment, user);
    }),
  );
}

// 댓글/대댓글 작성(parentId 있으면 대댓글). 원댓글이면 recount_post_comments RPC로 댓글 수 갱신.
export async function createComment(
  postId: string,
  content: string,
  parentId?: string,
): Promise<Comment> {
  const supabase = getSupabaseMobileClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error("댓글 내용을 입력해주세요.");
  }

  const insertComment: CommentInsert = {
    content: trimmedContent,
    parent_id: parentId ?? null,
    post_id: postId,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("comments")
    .insert(insertComment)
    .select("id, user_id, post_id, parent_id, content, likes_count, created_at")
    .single();

  if (error || !data) {
    throw new Error("댓글 작성에 실패했습니다.");
  }

  if (!parentId) {
    const { error: recountError } = await supabase.rpc("recount_post_comments", {
      p_post_id: postId,
    });

    if (recountError) {
      throw new Error("댓글 수 업데이트에 실패했습니다.");
    }
  }

  const usersById = await getUsersById([user.id]);
  const commentUser = usersById.get(user.id);

  if (!commentUser) {
    throw new Error("댓글 작성자 정보를 찾을 수 없습니다.");
  }

  return toComment(data as CommentRow, commentUser);
}

// 본인 댓글만 hard delete. 부모 댓글 삭제 시 대댓글/좋아요도 DB cascade로 함께 삭제된다.
export async function deleteComment(commentId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: comment, error: commentError } = await supabase
    .from("comments")
    .select("id, user_id, post_id, parent_id")
    .eq("id", commentId)
    .maybeSingle();

  if (commentError || !comment) {
    throw new Error("댓글을 찾을 수 없습니다.");
  }

  if (comment.user_id !== user.id) {
    throw new Error("본인 댓글만 삭제할 수 있습니다.");
  }

  const { error: deleteError } = await supabase
    .from("comments")
    .delete()
    .eq("id", comment.id);

  if (deleteError) {
    throw new Error("댓글 삭제에 실패했습니다.");
  }

  // 게시물 댓글 수는 원댓글만 반영한다.
  if (!comment.parent_id) {
    const { error: recountError } = await supabase.rpc("recount_post_comments", {
      p_post_id: comment.post_id,
    });

    if (recountError) {
      throw new Error("댓글 수 업데이트에 실패했습니다.");
    }
  }
}

// 현재 로그인 유저가 좋아요한 댓글 id 목록 (초기 좋아요 상태용).
export async function getLikedCommentIds(
  commentIds: string[],
): Promise<string[]> {
  if (commentIds.length === 0) {
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
    .from("comment_likes")
    .select("comment_id")
    .eq("user_id", user.id)
    .in("comment_id", commentIds);

  if (error || !data) {
    throw new Error("댓글 좋아요 정보를 불러오지 못했습니다.");
  }

  return data.map((like: Pick<CommentLikeRow, "comment_id">) => like.comment_id);
}

// 댓글 좋아요 토글 + recount_comment_likes RPC. RPC 실패 시 insert/delete 롤백.
export async function toggleCommentLike(
  commentId: string,
): Promise<{ liked: boolean; likesCount: number }> {
  const supabase = getSupabaseMobileClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: existingLike, error: likeSelectError } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("comment_id", commentId)
    .maybeSingle();

  if (likeSelectError) {
    throw new Error("댓글 좋아요 상태를 확인하지 못했습니다.");
  }

  const nextLiked = !existingLike;

  if (existingLike) {
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("id", existingLike.id);

    if (error) {
      throw new Error("댓글 좋아요 취소에 실패했습니다.");
    }
  } else {
    const commentLikeInsert: CommentLikeInsert = {
      comment_id: commentId,
      user_id: user.id,
    };

    const { error } = await supabase
      .from("comment_likes")
      .insert(commentLikeInsert);

    if (error) {
      throw new Error("댓글 좋아요에 실패했습니다.");
    }
  }

  const { data: likesCount, error: recountError } = await supabase.rpc(
    "recount_comment_likes",
    { p_comment_id: commentId },
  );

  if (recountError || typeof likesCount !== "number") {
    if (existingLike) {
      await supabase
        .from("comment_likes")
        .insert({ comment_id: commentId, user_id: user.id });
    } else {
      await supabase
        .from("comment_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("comment_id", commentId);
    }

    throw new Error("댓글 좋아요 수 업데이트에 실패했습니다.");
  }

  return { liked: nextLiked, likesCount };
}
