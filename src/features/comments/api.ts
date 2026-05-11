import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/database.types";

type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];
type CommentLikeRow = Database["public"]["Tables"]["comment_likes"]["Row"];
type CommentLikeInsert = Database["public"]["Tables"]["comment_likes"]["Insert"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type CommentUser = {
  avatar_url: string | null;
  id: string;
  nickname: string;
};

export type Comment = {
  content: string;
  created_at: string;
  id: string;
  likes_count: number;
  parent_id: string | null;
  replies: Comment[];
  user: CommentUser;
};

export type ToggleCommentLikeResult = {
  liked: boolean;
  likesCount: number;
};

function requireSupabaseClient() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  return supabase;
}

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

async function getUsersById(userIds: string[]) {
  const supabase = requireSupabaseClient();
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

async function updatePostCommentsCount(postId: string, delta: 1 | -1) {
  const supabase = requireSupabaseClient();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, comments_count")
    .eq("id", postId)
    .single();

  if (postError || !post) {
    throw new Error("게시물을 찾을 수 없습니다.");
  }

  const nextCommentsCount = Math.max(
    0,
    post.comments_count + delta,
  );

  const { error: updateError } = await supabase
    .from("posts")
    .update({ comments_count: nextCommentsCount })
    .eq("id", post.id);

  if (updateError) {
    throw new Error("댓글 수 업데이트에 실패했습니다.");
  }
}

// 댓글 UI에서 본인 댓글 여부를 판단할 수 있도록 현재 로그인 유저 id만 반환한다.
export async function getCurrentCommentUserId() {
  const supabase = requireSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  return user.id;
}

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

// 부모 댓글과 1단계 대댓글을 조회하고 부모 기준 중첩 구조로 반환한다.
export async function getComments(postId: string): Promise<Comment[]> {
  const supabase = requireSupabaseClient();

  const { data: comments, error } = await supabase
    .from("comments")
    .select("id, user_id, post_id, parent_id, content, likes_count, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error || !comments) {
    throw new Error("댓글을 불러오지 못했습니다.");
  }

  const usersById = await getUsersById(
    comments.map((comment: CommentRow) => comment.user_id),
  );

  const mappedComments = comments.map((comment: CommentRow) => {
    const user = usersById.get(comment.user_id);

    if (!user) {
      throw new Error("댓글 작성자 정보를 찾을 수 없습니다.");
    }

    return toComment(comment, user);
  });

  return buildCommentTree(mappedComments);
}

// 현재 로그인 유저로 댓글 또는 대댓글을 작성한다. 게시물 댓글 수는 부모 댓글만 반영한다.
export async function createComment(
  postId: string,
  content: string,
  parentId?: string,
): Promise<Comment> {
  const supabase = requireSupabaseClient();
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

  const { data: comment, error: insertError } = await supabase
    .from("comments")
    .insert(insertComment)
    .select("id, user_id, post_id, parent_id, content, likes_count, created_at")
    .single();

  if (insertError || !comment) {
    throw new Error("댓글 작성에 실패했습니다.");
  }

  if (!parentId) {
    await updatePostCommentsCount(postId, 1);
  }

  const usersById = await getUsersById([user.id]);
  const commentUser = usersById.get(user.id);

  if (!commentUser) {
    throw new Error("댓글 작성자 정보를 찾을 수 없습니다.");
  }

  return toComment(comment, commentUser);
}

// 본인 댓글만 hard delete한다. 부모 댓글 삭제 시 DB cascade로 대댓글과 좋아요도 함께 삭제된다.
export async function deleteComment(commentId: string) {
  const supabase = requireSupabaseClient();
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

  if (!comment.parent_id) {
    await updatePostCommentsCount(comment.post_id, -1);
  }
}

// 현재 로그인 유저가 좋아요한 댓글 id만 골라 댓글 목록 초기 상태에 사용한다.
export async function getLikedCommentIds(commentIds: string[]) {
  if (commentIds.length === 0) {
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
    .from("comment_likes")
    .select("comment_id")
    .eq("user_id", user.id)
    .in("comment_id", commentIds);

  if (error || !data) {
    throw new Error("댓글 좋아요 정보를 불러오지 못했습니다.");
  }

  return data.map((like: Pick<CommentLikeRow, "comment_id">) => like.comment_id);
}

// 댓글 좋아요 레코드와 comments.likes_count를 함께 갱신한다.
export async function toggleCommentLike(
  commentId: string,
): Promise<ToggleCommentLikeResult> {
  const supabase = requireSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: comment, error: commentError } = await supabase
    .from("comments")
    .select("id, likes_count")
    .eq("id", commentId)
    .single();

  if (commentError || !comment) {
    throw new Error("댓글을 찾을 수 없습니다.");
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
  const nextLikesCount = Math.max(
    0,
    comment.likes_count + (nextLiked ? 1 : -1),
  );

  if (existingLike) {
    const { error: deleteError } = await supabase
      .from("comment_likes")
      .delete()
      .eq("id", existingLike.id);

    if (deleteError) {
      throw new Error("댓글 좋아요 취소에 실패했습니다.");
    }
  } else {
    const commentLikeInsert: CommentLikeInsert = {
      comment_id: commentId,
      user_id: user.id,
    };

    const { error: insertError } = await supabase
      .from("comment_likes")
      .insert(commentLikeInsert);

    if (insertError) {
      throw new Error("댓글 좋아요에 실패했습니다.");
    }
  }

  const { data: updatedComment, error: updateError } = await supabase
    .from("comments")
    .update({ likes_count: nextLikesCount })
    .eq("id", commentId)
    .select("likes_count")
    .single();

  if (updateError || !updatedComment) {
    throw new Error("댓글 좋아요 수 업데이트에 실패했습니다.");
  }

  return {
    liked: nextLiked,
    likesCount: updatedComment.likes_count,
  };
}
