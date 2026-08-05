import type { NotificationItem, NotificationTarget } from "./types";
import type { NotificationMeta, NotificationRow } from "./notificationDbTypes";
import type { NotificationRelatedData } from "./notificationRelatedData";
import { getFallbackMeta } from "./notificationUtils";

// 보강된 meta와 관련 데이터를 합쳐 화면에서 바로 쓰는 NotificationItem으로 변환한다.
export function toNotificationItems(
  notifications: NotificationRow[],
  metaByNotificationId: Map<string, NotificationMeta>,
  relatedData: NotificationRelatedData,
): NotificationItem[] {
  const { storiesById, thumbnailByPostId, usersById } = relatedData;

  return notifications.map((notification): NotificationItem => {
    const meta =
      metaByNotificationId.get(notification.id) ?? getFallbackMeta(notification);
    const actorUser = meta.actorUserId ? usersById.get(meta.actorUserId) : null;
    const story = meta.storyId ? storiesById.get(meta.storyId) : null;

    // 집계형(좋아요): 최근순 행위자 요약 목록 + 총 인원. 없으면 단일 행위자로 대체.
    const actorIds =
      meta.actorUserIds && meta.actorUserIds.length > 0
        ? meta.actorUserIds
        : meta.actorUserId
          ? [meta.actorUserId]
          : [];
    const actors = actorIds
      .map((actorId) => usersById.get(actorId))
      .filter(
        (user): user is NonNullable<typeof user> => Boolean(user),
      )
      .map((user) => ({ avatar_url: user.avatar_url, nickname: user.nickname }));
    const actorCount = meta.actorCount ?? (actorUser ? 1 : 0);

    let target: NotificationTarget = null;

    if (
      (notification.type === "friend_request" ||
        notification.type === "friend_accepted") &&
      actorUser
    ) {
      target = { nickname: actorUser.nickname, type: "profile" };
    } else if (meta.postId) {
      target = { id: meta.postId, type: "post" };
    } else if (story) {
      target = { type: "story", userId: story.user_id };
    }

    return {
      actor: actorUser
        ? { avatar_url: actorUser.avatar_url, nickname: actorUser.nickname }
        : (actors[0] ?? null),
      actors,
      actorCount,
      created_at: notification.created_at,
      id: notification.id,
      is_read: notification.is_read,
      message: notification.message,
      reference_type: notification.reference_type,
      target,
      thumbnail_url: meta.postId
        ? thumbnailByPostId.get(meta.postId) ?? null
        : story?.image_url ?? null,
      type: notification.type,
    };
  });
}
