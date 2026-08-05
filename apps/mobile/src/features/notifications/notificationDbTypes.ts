import type { Database } from "../../types/database.types";

export type NotificationRow =
  Database["public"]["Tables"]["notifications"]["Row"];
export type PostLikeRow = Database["public"]["Tables"]["post_likes"]["Row"];
export type CommentLikeRow =
  Database["public"]["Tables"]["comment_likes"]["Row"];
export type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];
export type StoryRow = Database["public"]["Tables"]["stories"]["Row"];

export type NotificationMeta = {
  actorUserId: string | null;
  // 집계형(좋아요) 알림: 최근순 행위자 id들(최대 3)과 총 인원 수.
  actorUserIds?: string[];
  actorCount?: number;
  postId: string | null;
  storyId: string | null;
};
