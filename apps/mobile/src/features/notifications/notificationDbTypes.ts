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
  postId: string | null;
  storyId: string | null;
};
