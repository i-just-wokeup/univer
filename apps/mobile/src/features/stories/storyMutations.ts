import { getSupabaseMobileClient } from "../../lib/supabase";
import {
  getCurrentUserContext,
  getCurrentUserId,
} from "../shared/userContext";
import type { CreateVideoStoryParams } from "./storyTypes";
import type { StoryVisibility } from "./types";

// 스토리 생성(24시간 후 만료). 같은 학교/작성자/공개범위와 함께 insert한다.
export async function createStory(
  imageUrl: string | null,
  visibility: StoryVisibility = "public",
  backgroundColor: string | null = null,
  sharedPostId: string | null = null,
): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const { universityId, userId } = await getCurrentUserContext();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("stories").insert({
    background_color: backgroundColor,
    expires_at: expiresAt,
    image_url: imageUrl,
    shared_post_id: sharedPostId,
    university_id: universityId,
    user_id: userId,
    visibility,
  });

  if (error) {
    throw new Error("스토리 저장에 실패했습니다.");
  }
}

// 영상 스토리 생성. image_url에는 Cloudflare 재생 URL을 저장한다.
export async function createVideoStory({
  assetId,
  backgroundColor = null,
  durationSeconds = null,
  provider,
  status,
  thumbnailUrl = null,
  videoUrl,
  visibility = "public",
}: CreateVideoStoryParams): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const { universityId, userId } = await getCurrentUserContext();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("stories").insert({
    background_color: backgroundColor,
    duration: durationSeconds,
    expires_at: expiresAt,
    image_url: videoUrl,
    processing_status: status,
    provider,
    provider_asset_id: assetId,
    thumbnail_url: thumbnailUrl,
    type: "video",
    university_id: universityId,
    user_id: userId,
    visibility,
  });

  if (error) {
    throw new Error("영상 스토리 저장에 실패했습니다.");
  }
}

// 본인 스토리 soft delete. user_id 일치 행이 없으면 실패로 본다.
export async function deleteStory(storyId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("stories")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", storyId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error("스토리 삭제에 실패했습니다.");
  }
}
