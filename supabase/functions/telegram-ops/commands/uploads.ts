import type { CommandHandler } from "./types.ts";

export const uploadsCommand: CommandHandler = async ({ supabase }) => {
  const [
    processingPosts,
    failedPosts,
    processingStories,
    failedStories,
  ] = await Promise.all([
    supabase
      .from("post_media")
      .select("id", { count: "exact", head: true })
      .eq("type", "video")
      .eq("processing_status", "processing"),
    supabase
      .from("post_media")
      .select("id", { count: "exact", head: true })
      .eq("type", "video")
      .eq("processing_status", "failed"),
    supabase
      .from("stories")
      .select("id", { count: "exact", head: true })
      .eq("type", "video")
      .is("deleted_at", null)
      .eq("processing_status", "processing"),
    supabase
      .from("stories")
      .select("id", { count: "exact", head: true })
      .eq("type", "video")
      .is("deleted_at", null)
      .eq("processing_status", "failed"),
  ]);
  const queryError =
    processingPosts.error ??
    failedPosts.error ??
    processingStories.error ??
    failedStories.error;

  if (queryError) {
    throw new Error(`Uploads query failed: ${queryError.message}`);
  }

  const processing =
    (processingPosts.count ?? 0) + (processingStories.count ?? 0);
  const failed = (failedPosts.count ?? 0) + (failedStories.count ?? 0);

  return [
    "영상 처리 현황",
    "",
    `처리 중: ${processing}개`,
    `실패: ${failed}개`,
  ].join("\n");
};
