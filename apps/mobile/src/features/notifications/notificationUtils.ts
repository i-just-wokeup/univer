import type { NotificationMeta, NotificationRow } from "./notificationDbTypes";

// 같은 대상(target)별 행들 중 가장 최근 것만 남긴 맵.
export function getLatestRowsByTargetId<T extends { created_at: string }>(
  rows: T[],
  getTargetId: (row: T) => string,
) {
  const latestRowsByTargetId = new Map<string, T>();

  rows.forEach((row) => {
    const targetId = getTargetId(row);
    const currentRow = latestRowsByTargetId.get(targetId);

    if (!currentRow || currentRow.created_at < row.created_at) {
      latestRowsByTargetId.set(targetId, row);
    }
  });

  return latestRowsByTargetId;
}

// 보강 정보를 못 찾았을 때 reference_type/id만으로 만드는 최소 메타.
export function getFallbackMeta(notification: NotificationRow): NotificationMeta {
  if (notification.reference_type === "post" && notification.reference_id) {
    return {
      actorUserId: null,
      postId: notification.reference_id,
      storyId: null,
    };
  }

  if (notification.reference_type === "story" && notification.reference_id) {
    return {
      actorUserId: null,
      postId: null,
      storyId: notification.reference_id,
    };
  }

  return { actorUserId: null, postId: null, storyId: null };
}
