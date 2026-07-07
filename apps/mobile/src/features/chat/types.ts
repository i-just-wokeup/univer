import type { Database } from "../../types/database.types";
import type { FeedPost } from "../feed/types";

export type ConversationRow =
  Database["public"]["Tables"]["conversations"]["Row"];
export type ConversationInsert =
  Database["public"]["Tables"]["conversations"]["Insert"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type MessageInsert =
  Database["public"]["Tables"]["messages"]["Insert"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type ConversationWithUser = {
  id: string;
  status: "pending" | "active";
  initiated_by: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender_id: string | null;
  other_user: Pick<UserRow, "avatar_url" | "id" | "nickname">;
  unread_count: number;
};

export type Message = Pick<
  MessageRow,
  | "content"
  | "conversation_id"
  | "created_at"
  | "id"
  | "message_type"
  | "read_at"
  | "sender_id"
  | "shared_post_id"
> & {
  sharedPost?: SharedPostPreview | null;
};

export type SharedPostPreview = {
  aspect_ratio: FeedPost["aspect_ratio"];
  authorAvatarUrl: string | null;
  authorNickname: string;
  content: string | null;
  id: string;
  mediaType: FeedPost["media"][number]["type"] | null;
  thumbnailUrl: string | null;
};
