import type { NotificationRow } from "./notificationDbTypes";

export function getReferenceIds(
  notifications: NotificationRow[],
  type: NotificationRow["type"],
) {
  return notifications
    .filter(
      (notification) =>
        notification.type === type && Boolean(notification.reference_id),
    )
    .map((notification) => notification.reference_id)
    .filter((referenceId): referenceId is string => Boolean(referenceId));
}
