import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../types/database.types";
import type { NotificationMeta, NotificationRow } from "./notificationDbTypes";
import { applyCommentNotificationMeta } from "./notificationMetaComments";
import { applyFriendNotificationMeta } from "./notificationMetaFriends";
import { applyLikeNotificationMeta } from "./notificationMetaLikes";

type MobileSupabaseClient = SupabaseClient<Database>;

// 알림 타입별로 행위자(actor)·게시물/스토리 target 정보를 보강한다.
export async function enrichNotificationMeta(
  supabase: MobileSupabaseClient,
  notifications: NotificationRow[],
  userId: string,
  metaByNotificationId: Map<string, NotificationMeta>,
) {
  await applyLikeNotificationMeta(
    supabase,
    notifications,
    userId,
    metaByNotificationId,
  );
  await applyCommentNotificationMeta(
    supabase,
    notifications,
    userId,
    metaByNotificationId,
  );
  applyFriendNotificationMeta(notifications, metaByNotificationId);
}
