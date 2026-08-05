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

// 대상(target)별로 최근순 행위자 id 목록(최대 cap명)과 총 인원 수를 낸다.
// "철수님, 영희님 외 N명이 좋아합니다" 같은 집계 표시에 사용.
export function groupRecentActorsByTargetId<
  T extends { created_at: string; user_id: string },
>(
  rows: T[],
  getTargetId: (row: T) => string,
  cap = 3,
): Map<string, { count: number; userIds: string[] }> {
  const rowsByTarget = new Map<string, T[]>();

  rows.forEach((row) => {
    const targetId = getTargetId(row);
    const list = rowsByTarget.get(targetId);
    if (list) {
      list.push(row);
    } else {
      rowsByTarget.set(targetId, [row]);
    }
  });

  const result = new Map<string, { count: number; userIds: string[] }>();

  rowsByTarget.forEach((list, targetId) => {
    const sorted = [...list].sort((a, b) => {
      if (a.created_at < b.created_at) {
        return 1;
      }
      if (a.created_at > b.created_at) {
        return -1;
      }
      return 0;
    });

    const seen = new Set<string>();
    const userIds: string[] = [];
    sorted.forEach((row) => {
      if (!seen.has(row.user_id)) {
        seen.add(row.user_id);
        userIds.push(row.user_id);
      }
    });

    result.set(targetId, { count: userIds.length, userIds: userIds.slice(0, cap) });
  });

  return result;
}
