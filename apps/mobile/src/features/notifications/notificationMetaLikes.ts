import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../types/database.types";
import type {
  NotificationMeta,
  NotificationRow,
  PostLikeRow,
} from "./notificationDbTypes";
import {
  getReferenceIds,
  groupRecentActorsByTargetId,
} from "./notificationMetaUtils";

type MobileSupabaseClient = SupabaseClient<Database>;

async function applyPostLikeMeta(
  supabase: MobileSupabaseClient,
  notifications: NotificationRow[],
  userId: string,
  metaByNotificationId: Map<string, NotificationMeta>,
) {
  const postLikeTargetIds = getReferenceIds(notifications, "post_like");

  if (postLikeTargetIds.length === 0) {
    return;
  }

  const { data: postLikes, error } = await supabase
    .from("post_likes")
    .select("id, user_id, target_type, target_id, created_at")
    .eq("target_type", "post")
    .neq("user_id", userId)
    .in("target_id", postLikeTargetIds);

  if (error || !postLikes) {
    throw new Error("좋아요 알림 정보를 불러오지 못했습니다.");
  }

  const actorsByPostId = groupRecentActorsByTargetId(
    postLikes as PostLikeRow[],
    (postLike) => postLike.target_id,
  );

  notifications.forEach((notification) => {
    if (notification.type !== "post_like" || !notification.reference_id) {
      return;
    }

    const actors = actorsByPostId.get(notification.reference_id);

    if (actors && actors.userIds.length > 0) {
      metaByNotificationId.set(notification.id, {
        actorUserId: actors.userIds[0],
        actorUserIds: actors.userIds,
        actorCount: actors.count,
        postId: notification.reference_id,
        storyId: null,
      });
    }
  });
}

async function applyStoryLikeMeta(
  supabase: MobileSupabaseClient,
  notifications: NotificationRow[],
  userId: string,
  metaByNotificationId: Map<string, NotificationMeta>,
) {
  const storyLikeTargetIds = getReferenceIds(notifications, "story_like");

  if (storyLikeTargetIds.length === 0) {
    return;
  }

  const { data: storyLikes, error } = await supabase
    .from("post_likes")
    .select("id, user_id, target_type, target_id, created_at")
    .eq("target_type", "story")
    .neq("user_id", userId)
    .in("target_id", storyLikeTargetIds);

  if (error || !storyLikes) {
    throw new Error("스토리 좋아요 알림 정보를 불러오지 못했습니다.");
  }

  const actorsByStoryId = groupRecentActorsByTargetId(
    storyLikes as PostLikeRow[],
    (storyLike) => storyLike.target_id,
  );

  notifications.forEach((notification) => {
    if (notification.type !== "story_like" || !notification.reference_id) {
      return;
    }

    const actors = actorsByStoryId.get(notification.reference_id);

    if (actors && actors.userIds.length > 0) {
      metaByNotificationId.set(notification.id, {
        actorUserId: actors.userIds[0],
        actorUserIds: actors.userIds,
        actorCount: actors.count,
        postId: null,
        storyId: notification.reference_id,
      });
    }
  });
}

export async function applyLikeNotificationMeta(
  supabase: MobileSupabaseClient,
  notifications: NotificationRow[],
  userId: string,
  metaByNotificationId: Map<string, NotificationMeta>,
) {
  await applyPostLikeMeta(supabase, notifications, userId, metaByNotificationId);
  await applyStoryLikeMeta(
    supabase,
    notifications,
    userId,
    metaByNotificationId,
  );
}
