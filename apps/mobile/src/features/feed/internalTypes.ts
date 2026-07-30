import type { Database } from "../../types/database.types";
import type { PostAspectRatio, PostVisibility } from "./types";

export type PostRow = Database["public"]["Tables"]["posts"]["Row"];
export type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type PostLikeRow = Database["public"]["Tables"]["post_likes"]["Row"];
export type BookmarkRow = Database["public"]["Tables"]["bookmarks"]["Row"];

export type FeedPostUserRow = Pick<
  UserRow,
  "avatar_url" | "department" | "department_public" | "id" | "nickname"
>;

export type FeedPostMediaRow = Pick<
  PostMediaRow,
  | "duration"
  | "id"
  | "order_index"
  | "post_id"
  | "processing_status"
  | "provider"
  | "provider_asset_id"
  | "thumbnail_url"
  | "type"
  | "url"
>;

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
  // PostgREST embedding 결과. DB 타입 파일의 Relationships가 비어 있어 앱 내부에서 명시한다.
  post_media: FeedPostMediaRow[] | null;
  user: FeedPostUserRow | null;
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

export const USER_SELECT_FIELDS =
  "id, nickname, department, department_public, avatar_url";

export const POST_MEDIA_SELECT_FIELDS =
  "id, post_id, type, url, thumbnail_url, duration, order_index, provider, provider_asset_id, processing_status";

export const POST_WITH_RELATIONS_SELECT_FIELDS =
  `${POST_SELECT_FIELDS}, user:users(${USER_SELECT_FIELDS}), post_media(${POST_MEDIA_SELECT_FIELDS})` as const;

export const POST_WITH_VIDEO_MEDIA_SELECT_FIELDS =
  `${POST_SELECT_FIELDS}, user:users(${USER_SELECT_FIELDS}), post_media:post_media!inner(${POST_MEDIA_SELECT_FIELDS})` as const;
