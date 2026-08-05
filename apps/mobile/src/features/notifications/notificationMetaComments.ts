import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../types/database.types";
import type {
  CommentLikeRow,
  CommentRow,
  NotificationMeta,
  NotificationRow,
} from "./notificationDbTypes";
import {
  getReferenceIds,
  groupRecentActorsByTargetId,
} from "./notificationMetaUtils";
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

  const actorsByCommentId = groupRecentActorsByTargetId(
    commentLikes as CommentLikeRow[],
    (commentLike) => commentLike.comment_id,
  );
  const commentsById = new Map<string, CommentRow>(
    comments.map((comment: CommentRow) => [comment.id, comment]),
  );

  notifications.forEach((notification) => {
    if (notification.type !== "comment_like" || !notification.reference_id) {
      return;
    }

    const actors = actorsByCommentId.get(notification.reference_id);
    const comment = commentsById.get(notification.reference_id);

    if (actors && actors.userIds.length > 0 && comment) {
      metaByNotificationId.set(notification.id, {
        actorUserId: actors.userIds[0],
        actorUserIds: actors.userIds,
        actorCount: actors.count,
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

// 대댓글(comment_reply) 알림: reference_id는 게시물 id라서, 내가 그 게시물에 단
// 댓글에 달린 "남의 답글" 중 최신 것으로 행위자를 되짚는다.
async function applyCommentReplyMeta(
  supabase: MobileSupabaseClient,
  notifications: NotificationRow[],
  userId: string,
  metaByNotificationId: Map<string, NotificationMeta>,
) {
  const replyPostIds = getReferenceIds(notifications, "comment_reply");

  if (replyPostIds.length === 0) {
    return;
  }

  const { data: myComments, error: myCommentsError } = await supabase
    .from("comments")
    .select("id, post_id")
    .eq("user_id", userId)
    .in("post_id", replyPostIds);

  if (myCommentsError || !myComments) {
    throw new Error("답글 알림 정보를 불러오지 못했습니다.");
  }

  if (myComments.length === 0) {
    return;
  }

  const myCommentIds = myComments.map(
    (comment: Pick<CommentRow, "id">) => comment.id,
  );

  const { data: replies, error: repliesError } = await supabase
    .from("comments")
    .select("id, user_id, post_id, parent_id, content, likes_count, created_at")
    .neq("user_id", userId)
    .in("parent_id", myCommentIds);

  if (repliesError || !replies) {
    throw new Error("답글 알림 정보를 불러오지 못했습니다.");
  }

  const latestReplyByPostId = getLatestRowsByTargetId(
    replies as CommentRow[],
    (reply) => reply.post_id,
  );

  notifications.forEach((notification) => {
    if (notification.type !== "comment_reply" || !notification.reference_id) {
      return;
    }

    const reply = latestReplyByPostId.get(notification.reference_id);

    if (reply) {
      metaByNotificationId.set(notification.id, {
        actorUserId: reply.user_id,
        postId: reply.post_id,
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
  await applyCommentReplyMeta(
    supabase,
    notifications,
    userId,
    metaByNotificationId,
  );
}
