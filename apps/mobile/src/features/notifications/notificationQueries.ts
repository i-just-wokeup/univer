import { PAGE_SIZE } from "../../lib/constants/pagination";
import { getSupabaseMobileClient } from "../../lib/supabase";
import { getCurrentUserId } from "../shared/userContext";
import { toNotificationItems } from "./notificationHydration";
import { enrichNotificationMeta } from "./notificationMeta";
import { loadNotificationRelatedData } from "./notificationRelatedData";
import type { NotificationMeta, NotificationRow } from "./notificationDbTypes";
import { getFallbackMeta } from "./notificationUtils";
import type { NotificationItem } from "./types";

// 알림 목록 조회 + 보강. 행위자·썸네일·탭 대상까지 합쳐 화면용 모델로 반환한다.
export async function getNotifications(): Promise<NotificationItem[]> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select(
      "id, user_id, type, reference_type, reference_id, message, is_read, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE.notifications);

  if (error || !notifications) {
    throw new Error("알림을 불러오지 못했습니다.");
  }

  if (notifications.length === 0) {
    return [];
  }

  const notificationRows = notifications as NotificationRow[];
  const metaByNotificationId = new Map<string, NotificationMeta>();

  notificationRows.forEach((notification) => {
    metaByNotificationId.set(notification.id, getFallbackMeta(notification));
  });

  await enrichNotificationMeta(
    supabase,
    notificationRows,
    userId,
    metaByNotificationId,
  );

  const relatedData = await loadNotificationRelatedData(
    supabase,
    metaByNotificationId,
  );

  return toNotificationItems(notificationRows, metaByNotificationId, relatedData);
}

// 안읽은 알림 수(헤더 뱃지용).
export async function getUnreadCount(): Promise<number> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    throw new Error("읽지 않은 알림 수를 불러오지 못했습니다.");
  }

  return count ?? 0;
}
