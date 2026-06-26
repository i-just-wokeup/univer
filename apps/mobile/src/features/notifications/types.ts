import type { Database } from "../../types/database.types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export type NotificationType = NotificationRow["type"];

export type NotificationActor = {
  avatar_url: string | null;
  nickname: string;
} | null;

// 알림 탭 시 이동 대상. RN 라우팅에 바로 쓰도록 구조화한다.
export type NotificationTarget =
  | { type: "chat"; conversationId: string }
  | { type: "post"; id: string }
  | { type: "story"; userId: string }
  | { type: "profile"; nickname: string }
  | null;

export type NotificationItem = {
  actor: NotificationActor;
  created_at: string;
  id: string;
  is_read: boolean;
  message: string | null;
  reference_type: NotificationRow["reference_type"];
  target: NotificationTarget;
  thumbnail_url: string | null;
  type: NotificationType;
};
