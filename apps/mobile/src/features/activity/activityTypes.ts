import type { Database } from "../../types/database.types";
import type { StorySharedPost } from "../stories/types";

export type BookmarkRow = Database["public"]["Tables"]["bookmarks"]["Row"];
export type PostRow = Database["public"]["Tables"]["posts"]["Row"];
export type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];
export type PostLikeRow = Database["public"]["Tables"]["post_likes"]["Row"];
export type StoryViewRow = Database["public"]["Tables"]["story_views"]["Row"];
export type StoryRow = Database["public"]["Tables"]["stories"]["Row"];
export type UserFavoriteRow =
  Database["public"]["Tables"]["user_favorites"]["Row"];
export type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type ActivityStory = Pick<
  StoryRow,
  | "created_at"
  | "background_color"
  | "expires_at"
  | "id"
  | "image_url"
  | "is_archived"
  | "processing_status"
  | "shared_post_id"
  | "thumbnail_url"
  | "type"
  | "visibility"
  | "views_count"
> & {
  sharedPost: StorySharedPost | null;
};

export type ActivityPostMedia = Pick<
  PostMediaRow,
  "id" | "order_index" | "thumbnail_url" | "type" | "url"
>;

export type ActivityPost = Pick<
  PostRow,
  "comments_count" | "content" | "created_at" | "id" | "likes_count"
> & {
  media: ActivityPostMedia[];
  saved_at?: string;
  user: {
    avatar_url: string | null;
    department: string | null;
    id: string;
    nickname: string;
  };
};

export type ActivityStoryViewer = Pick<
  UserRow,
  "avatar_url" | "id" | "nickname"
> & {
  isLiked: boolean;
  viewed_at: string;
};

export type ActivityFavoriteUser = {
  avatar_url: string | null;
  department: string | null;
  id: string;
  nickname: string;
  favorited_at: string;
};
