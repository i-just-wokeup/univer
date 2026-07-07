import { getSupabaseMobileClient } from "../../lib/supabase";
import { getCurrentUserId } from "../shared/userContext";
import type { PostLikeInsert } from "./storyTypes";

// 스토리 조회 기록(중복 무시 upsert). 새로 기록된 경우에만 조회수를 재계산한다.
export async function recordStoryView(storyId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();

  const { data: insertedViews, error: viewError } = await supabase
    .from("story_views")
    .upsert(
      {
        story_id: storyId,
        user_id: userId,
      },
      {
        ignoreDuplicates: true,
        onConflict: "story_id,user_id",
      },
    )
    .select("id");

  if (viewError) {
    throw new Error("스토리 조회 기록 저장에 실패했습니다.");
  }

  if (!insertedViews || insertedViews.length === 0) {
    return;
  }

  const { error: recountError } = await supabase.rpc("recount_story_views", {
    p_story_id: storyId,
  });

  if (recountError) {
    throw new Error("스토리 조회수 업데이트에 실패했습니다.");
  }
}

// 스토리 좋아요 토글. post_likes(target_type='story')에 insert/delete한다.
export async function toggleStoryLike(
  storyId: string,
): Promise<{ liked: boolean }> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();

  const { data: existingLike, error: likeSelectError } = await supabase
    .from("post_likes")
    .select("id")
    .eq("user_id", userId)
    .eq("target_type", "story")
    .eq("target_id", storyId)
    .maybeSingle();

  if (likeSelectError) {
    throw new Error("스토리 좋아요 상태를 확인하지 못했습니다.");
  }

  if (existingLike) {
    const { error: deleteError } = await supabase
      .from("post_likes")
      .delete()
      .eq("id", existingLike.id);

    if (deleteError) {
      throw new Error("스토리 좋아요 취소에 실패했습니다.");
    }

    return { liked: false };
  }

  const storyLikeInsert: PostLikeInsert = {
    target_id: storyId,
    target_type: "story",
    user_id: userId,
  };

  const { error: insertError } = await supabase
    .from("post_likes")
    .insert(storyLikeInsert);

  if (insertError) {
    throw new Error("스토리 좋아요에 실패했습니다.");
  }

  return { liked: true };
}

// 현재 유저가 이 스토리에 좋아요했는지 여부.
export async function getMyStoryLikedStatus(storyId: string): Promise<boolean> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("post_likes")
    .select("id")
    .eq("user_id", userId)
    .eq("target_type", "story")
    .eq("target_id", storyId)
    .maybeSingle();

  if (error) {
    throw new Error("스토리 좋아요 상태를 불러오지 못했습니다.");
  }

  return Boolean(data);
}
