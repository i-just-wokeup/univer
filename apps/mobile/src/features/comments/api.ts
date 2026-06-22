import type { Database } from "../../../../../src/types/database.types";
import { getSupabaseMobileClient } from "../../lib/supabase";
import type { Comment, CommentUser } from "./types";

type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

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

export async function getComments(postId: string): Promise<Comment[]> {
  const supabase = getSupabaseMobileClient();

  const { data, error } = await supabase
    .from("comments")
    .select("id, user_id, post_id, parent_id, content, likes_count, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error("댓글을 불러오지 못했습니다.");
  }

  const comments = data as CommentRow[];
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
