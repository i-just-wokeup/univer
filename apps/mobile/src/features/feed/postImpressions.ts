import type { Database } from "../../types/database.types";
import { getSupabaseMobileClient } from "../../lib/supabase";
import { getCurrentUserId } from "../shared/userContext";

type PostImpressionInsert =
  Database["public"]["Tables"]["post_impressions"]["Insert"];

export async function recordPostImpressions(postIds: string[]): Promise<void> {
  const uniquePostIds = Array.from(new Set(postIds.filter(Boolean)));

  if (uniquePostIds.length === 0) {
    return;
  }

  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();
  const rows: PostImpressionInsert[] = uniquePostIds.map((postId) => ({
    post_id: postId,
    user_id: userId,
  }));

  const { error } = await supabase
    .from("post_impressions")
    .upsert(rows, {
      ignoreDuplicates: true,
      onConflict: "user_id,post_id",
    });

  if (error) {
    throw new Error("피드 열람 기록을 저장하지 못했습니다.");
  }
}
