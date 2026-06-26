import type { Router } from "expo-router";

import type { NotificationTarget } from "./types";

type PushNotificationData = {
  targetId?: unknown;
  targetNickname?: unknown;
  targetType?: unknown;
  targetUserId?: unknown;
};

export function routeToNotificationTarget(
  router: Router,
  target: NotificationTarget,
) {
  if (!target) {
    return;
  }

  if (target.type === "post") {
    router.push({ pathname: "/post/[id]", params: { id: target.id } });
  } else if (target.type === "story") {
    router.push({
      pathname: "/story/[userId]",
      params: { userId: target.userId },
    });
  } else if (target.type === "profile") {
    router.push({
      pathname: "/profile/[nickname]",
      params: { nickname: target.nickname },
    });
  }
}

export function getNotificationTargetFromPushData(
  data: PushNotificationData,
): NotificationTarget {
  const targetType = typeof data.targetType === "string" ? data.targetType : "";
  const targetId = typeof data.targetId === "string" ? data.targetId : "";

  if (targetType === "post" && targetId) {
    return { id: targetId, type: "post" };
  }

  if (targetType === "story") {
    const userId =
      typeof data.targetUserId === "string" ? data.targetUserId : targetId;
    return userId ? { type: "story", userId } : null;
  }

  if (targetType === "user" || targetType === "profile") {
    const nickname =
      typeof data.targetNickname === "string" ? data.targetNickname : targetId;
    return nickname ? { nickname, type: "profile" } : null;
  }

  return null;
}
