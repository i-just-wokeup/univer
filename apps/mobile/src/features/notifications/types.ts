import type { Database } from "../../types/database.types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export type NotificationType = NotificationRow["type"];

export type NotificationActorSummary = {
  avatar_url: string | null;
  nickname: string;
};

export type NotificationActor = NotificationActorSummary | null;

// 알림 탭 시 이동 대상. RN 라우팅에 바로 쓰도록 구조화한다.
export type NotificationTarget =
  | { type: "chat"; conversationId: string }
  | { type: "post"; id: string }
  | { type: "story"; userId: string }
  | { type: "profile"; nickname: string }
  | { type: "insights" }
  | null;

export type NotificationItem = {
  actor: NotificationActor;
  // 집계형(좋아요) 표시용: 최근순 행위자 요약(아바타 겹치기) + 총 인원.
  actors: NotificationActorSummary[];
  actorCount: number;
  created_at: string;
  id: string;
  is_read: boolean;
  message: string | null;
  reference_type: NotificationRow["reference_type"];
  target: NotificationTarget;
  thumbnail_url: string | null;
  type: NotificationType;
};
