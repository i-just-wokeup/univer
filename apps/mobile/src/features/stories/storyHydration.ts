import type { Story, StoryUser } from "./types";
import type { StoryRow } from "./storyTypes";

// DB stories row를 앱 뷰어가 쓰는 Story 모델로 정규화한다.
export function toStory(row: StoryRow, storyUser: StoryUser, currentUserId: string): Story {
  return {
    backgroundColor: row.background_color,
    created_at: row.created_at,
    duration_seconds: row.duration,
    expires_at: row.expires_at,
    id: row.id,
    image_url: row.image_url,
    isMine: row.user_id === currentUserId,
    mediaType: row.type === "video" ? "video" : "image",
    processing_status: row.processing_status,
    provider: row.provider,
    provider_asset_id: row.provider_asset_id,
    thumbnail_url: row.thumbnail_url,
    user: storyUser,
    user_id: row.user_id,
    views_count: row.views_count,
  };
}
