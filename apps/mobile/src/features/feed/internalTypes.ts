import type { Database } from "../../types/database.types";
import type { PostAspectRatio, PostVisibility } from "./types";

export type PostRow = Database["public"]["Tables"]["posts"]["Row"];
export type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type PostLikeRow = Database["public"]["Tables"]["post_likes"]["Row"];
export type BookmarkRow = Database["public"]["Tables"]["bookmarks"]["Row"];

export type FeedPostRow = Pick<
  PostRow,
  | "comments_count"
  | "content"
  | "created_at"
  | "id"
  | "likes_count"
  | "user_id"
  | "visibility"
> & {
  aspect_ratio?: PostAspectRatio;
};

// 게시물은 사진 여러 장 OR 영상 1개(섞지 않음). video가 있으면 영상 게시물로 저장한다.
export type CreatePostVideo = {
  assetId: string;
  durationSeconds: number | null;
  provider: "cloudflare_stream";
  status: "processing";
  thumbnailUrl: string | null;
  url: string;
};

export type CreatePostParams = {
  aspectRatio: PostAspectRatio;
  content: string;
  imageUrls: string[];
  video?: CreatePostVideo | null;
  visibility: PostVisibility;
};

export type VideoProcessingStatus = {
  processingStatus: "processing" | "ready" | "failed";
  providerAssetId: string;
  thumbnailUrl: string | null;
  url: string;
};

export type PostCounts = {
  comments_count: number;
  id: string;
  likes_count: number;
};

export const POST_SELECT_FIELDS =
  "id, aspect_ratio, content, created_at, likes_count, comments_count, user_id, visibility";

export const USER_SELECT_FIELDS = "id, nickname, department, avatar_url";

export const POST_MEDIA_SELECT_FIELDS =
  "id, post_id, type, url, thumbnail_url, duration, order_index, provider, provider_asset_id, processing_status";
