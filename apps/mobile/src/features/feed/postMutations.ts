import { getSupabaseMobileClient } from "../../lib/supabase";
import { getCurrentUserContext } from "../shared/userContext";
import type { CreatePostParams } from "./internalTypes";

// 게시물 작성은 DB insert만 담당한다. 이미지/영상 업로드는 postUpload.ts에서 먼저 끝낸다.
export async function createPost({
  aspectRatio,
  content,
  imageUrls,
  video,
  visibility,
}: CreatePostParams): Promise<string> {
  const supabase = getSupabaseMobileClient();
  const { universityId, userId } = await getCurrentUserContext();
  const trimmedContent = content.trim();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      aspect_ratio: aspectRatio,
      content: trimmedContent || null,
      university_id: universityId,
      user_id: userId,
      visibility,
    })
    .select("id")
    .single();

  if (postError || !post) {
    throw new Error("게시물 작성에 실패했습니다.");
  }

  if (video) {
    const { error: mediaError } = await supabase.from("post_media").insert({
      duration: video.durationSeconds,
      order_index: 0,
      post_id: post.id,
      processing_status: video.status,
      provider: video.provider,
      provider_asset_id: video.assetId,
      thumbnail_url: video.thumbnailUrl,
      type: "video" as const,
      url: video.url,
    });

    if (mediaError) {
      await supabase.from("posts").delete().eq("id", post.id);
      throw new Error("게시물 영상을 저장하지 못했습니다.");
    }
  } else if (imageUrls.length > 0) {
    const { error: mediaError } = await supabase.from("post_media").insert(
      imageUrls.map((url, index) => ({
        order_index: index,
        post_id: post.id,
        type: "image" as const,
        url,
      })),
    );

    if (mediaError) {
      await supabase.from("posts").delete().eq("id", post.id);
      throw new Error("게시물 이미지를 저장하지 못했습니다.");
    }
  }

  return post.id;
}

// 본인 글만 soft delete한다. RLS가 있어도 user_id 조건을 같이 걸어 의도를 코드에 남긴다.
export async function deletePost(postId: string): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const { userId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error("게시물 삭제에 실패했습니다.");
  }
}
