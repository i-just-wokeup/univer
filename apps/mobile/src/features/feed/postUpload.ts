import { STORAGE_BUCKETS, STORAGE_FOLDERS } from "../../lib/constants/storage";
import { uploadImagesToBucket } from "../shared/imageUpload";
import {
  uploadVideoToCloudflareStream,
  type CloudflareStreamUploadResult,
} from "../shared/streamUpload";

// 게시물 이미지들을 post-images 버킷에 업로드(1600px 리사이즈) → 공개 URL 배열.
export async function uploadPostImages(uris: string[]): Promise<string[]> {
  return uploadImagesToBucket(
    STORAGE_BUCKETS.postImages,
    STORAGE_FOLDERS.posts,
    uris,
    1600,
  );
}

// 게시물 영상은 Supabase Storage가 아니라 Cloudflare Stream에 직접 업로드한다.
export async function uploadPostVideo(
  uri: string,
): Promise<CloudflareStreamUploadResult> {
  return uploadVideoToCloudflareStream(uri);
}
