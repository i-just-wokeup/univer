import { STORAGE_BUCKETS, STORAGE_FOLDERS } from "../../lib/constants/storage";
import { uploadImagesToBucket } from "../shared/imageUpload";
import {
  uploadVideoToCloudflareStream,
  type CloudflareStreamUploadResult,
} from "../shared/streamUpload";

// 로컬 이미지 한 장을 story-images 버킷에 올리고 공개 URL을 반환한다.
export async function uploadStoryImage(uri: string): Promise<string> {
  const [url] = await uploadImagesToBucket(
    STORAGE_BUCKETS.storyImages,
    STORAGE_FOLDERS.stories,
    [uri],
    1080,
  );

  if (!url) {
    throw new Error("스토리 이미지 업로드에 실패했습니다.");
  }

  return url;
}

// 로컬 영상 파일을 Cloudflare Stream에 직접 업로드하고 HLS 재생 URL/asset id를 반환한다.
export async function uploadStoryVideo(
  uri: string,
): Promise<CloudflareStreamUploadResult> {
  return uploadVideoToCloudflareStream(uri);
}
