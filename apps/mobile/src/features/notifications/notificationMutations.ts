import { getSupabaseMobileClient } from "../../lib/supabase";
import { getCurrentUserId } from "../shared/userContext";

// 알림 하나 읽음 처리(본인 것만).
export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    throw new Error("알림 읽음 처리에 실패했습니다.");
  }
}

// 안읽은 알림 전체 읽음 처리.
export async function markAllAsRead(): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    throw new Error("전체 알림 읽음 처리에 실패했습니다.");
  }
}
