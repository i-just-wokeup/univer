import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../types/database.types";
import type {
  CommentLikeRow,
  CommentRow,
  NotificationMeta,
  NotificationRow,
} from "./notificationDbTypes";
import { getReferenceIds } from "./notificationMetaUtils";
import { getLatestRowsByTargetId } from "./notificationUtils";

type MobileSupabaseClient = SupabaseClient<Database>;

async function applyCommentLikeMeta(
  supabase: MobileSupabaseClient,
  notifications: NotificationRow[],
  userId: string,
  metaByNotificationId: Map<string, NotificationMeta>,
) {
  const commentLikeReferenceIds = getReferenceIds(notifications, "comment_like");

  if (commentLikeReferenceIds.length === 0) {
    return;
  }

  const { data: commentLikes, error: commentLikesError } = await supabase
    .from("comment_likes")
    .select("id, user_id, comment_id, created_at")
    .neq("user_id", userId)
    .in("comment_id", commentLikeReferenceIds);

  if (commentLikesError || !commentLikes) {
    throw new Error("댓글 좋아요 알림 정보를 불러오지 못했습니다.");
  }

  const commentIds = commentLikes.map(
    (commentLike: Pick<CommentLikeRow, "comment_id">) => commentLike.comment_id,
  );
  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select("id, user_id, post_id, parent_id, content, likes_count, created_at")
    .in("id", commentIds);

  if (commentsError || !comments) {
    throw new Error("댓글 알림 정보를 불러오지 못했습니다.");
  }

  const latestCommentLikesByCommentId = getLatestRowsByTargetId(
    commentLikes as CommentLikeRow[],
    (commentLike) => commentLike.comment_id,
  );
  const commentsById = new Map<string, CommentRow>(
    comments.map((comment: CommentRow) => [comment.id, comment]),
  );

  notifications.forEach((notification) => {
    if (notification.type !== "comment_like") {
      return;
    }

    const commentLike = notification.reference_id
      ? latestCommentLikesByCommentId.get(notification.reference_id)
      : null;
    const comment = commentLike
      ? commentsById.get(commentLike.comment_id)
      : null;

    if (commentLike && comment) {
      metaByNotificationId.set(notification.id, {
        actorUserId: commentLike.user_id,
        postId: comment.post_id,
        storyId: null,
      });
    }
  });
}

async function applyPostCommentMeta(
  supabase: MobileSupabaseClient,
  notifications: NotificationRow[],
  userId: string,
  metaByNotificationId: Map<string, NotificationMeta>,
) {
  const commentReferenceIds = getReferenceIds(notifications, "post_comment");

  if (commentReferenceIds.length === 0) {
    return;
  }

  const { data: comments, error } = await supabase
    .from("comments")
    .select("id, user_id, post_id, parent_id, content, likes_count, created_at")
    .neq("user_id", userId)
    .in("post_id", commentReferenceIds);

  if (error || !comments) {
    throw new Error("댓글 알림 정보를 불러오지 못했습니다.");
  }

  const latestCommentsByPostId = getLatestRowsByTargetId(
    comments as CommentRow[],
    (comment) => comment.post_id,
  );

  notifications.forEach((notification) => {
    if (notification.type !== "post_comment") {
      return;
    }

    const comment = notification.reference_id
      ? latestCommentsByPostId.get(notification.reference_id)
      : null;

    if (comment) {
      metaByNotificationId.set(notification.id, {
        actorUserId: comment.user_id,
        postId: comment.post_id,
        storyId: null,
      });
    }
  });
}

export async function applyCommentNotificationMeta(
  supabase: MobileSupabaseClient,
  notifications: NotificationRow[],
  userId: string,
  metaByNotificationId: Map<string, NotificationMeta>,
) {
  await applyCommentLikeMeta(
    supabase,
    notifications,
    userId,
    metaByNotificationId,
  );
  await applyPostCommentMeta(
    supabase,
    notifications,
    userId,
    metaByNotificationId,
  );
}
