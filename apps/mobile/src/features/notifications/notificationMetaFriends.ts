import type { NotificationMeta, NotificationRow } from "./notificationDbTypes";

export function applyFriendNotificationMeta(
  notifications: NotificationRow[],
  metaByNotificationId: Map<string, NotificationMeta>,
) {
  notifications.forEach((notification) => {
    if (
      (notification.type !== "friend_request" &&
        notification.type !== "friend_accepted") ||
      !notification.reference_id
    ) {
      return;
    }

    metaByNotificationId.set(notification.id, {
      actorUserId: notification.reference_id,
      postId: null,
      storyId: null,
    });
  });
}
