import { getThumbnailAsync } from "expo-video-thumbnails";
import { useState } from "react";

import { createPost, uploadPostImages, uploadPostVideo } from "./api";
import type { PreparedPostLibraryVideo } from "./postMediaLibrary";
import type { PostAspectRatio, PostVisibility } from "./types";

export const MAX_IMAGES = 10;
// 릴스/피드 영상 업로드 제한. 길이는 비용/인코딩을, 용량은 업로드 안정성을 위해 사전 차단.
type SelectedVideo = {
  durationSeconds: number | null;
  uri: string;
};

export function detectAspectRatio(
  width?: number,
  height?: number,
): PostAspectRatio {
  if (!width || !height) {
    return "square";
  }

  const ratio = width / height;

  if (ratio >= 1.1) {
    return "landscape";
  }

  if (ratio <= 0.9) {
    return "portrait";
  }

  return "square";
}

// 게시물 작성 폼 상태/이미지 선택/업로드 로직. 업로드 성공 여부만 반환하고 화면 이동은 호출부가 한다.
export function useWriteForm() {
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<SelectedVideo | null>(null);
  const [aspectRatio, setAspectRatio] = useState<PostAspectRatio>("square");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const canSubmit =
    !isSubmitting &&
    (imageUris.length > 0 || selectedVideo !== null || content.trim().length > 0);
  const hasDraft =
    imageUris.length > 0 || selectedVideo !== null || content.trim().length > 0;

  function resetForm() {
    setImageUris([]);
    setSelectedVideo(null);
    setAspectRatio("square");
    setContent("");
    setVisibility("public");
    setErrorMessage("");
  }

  function removeImage(index: number) {
    setImageUris((currentUris) =>
      currentUris.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function removeVideo() {
    setSelectedVideo(null);
  }

  function replaceImages(nextImageUris: string[]) {
    setErrorMessage("");
    setSelectedVideo(null);
    setImageUris(nextImageUris.slice(0, MAX_IMAGES));
  }

  function replaceVideo(nextVideo: PreparedPostLibraryVideo) {
    setErrorMessage("");
    setImageUris([]);
    setSelectedVideo({
      durationSeconds: Math.round(nextVideo.durationSeconds),
      uri: nextVideo.uri,
    });
    setAspectRatio(detectAspectRatio(nextVideo.width, nextVideo.height));
  }

  // 작성 성공 시 true 반환(화면 이동은 호출부). 실패 시 false.
  async function submit(): Promise<boolean> {
    if (!canSubmit) {
      return false;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      if (selectedVideo) {
        let thumbnailUrl: string | null = null;

        try {
          const thumbnail = await getThumbnailAsync(selectedVideo.uri, { time: 0 });
          const [uploadedThumbnailUrl] = await uploadPostImages([thumbnail.uri]);
          thumbnailUrl = uploadedThumbnailUrl ?? null;
        } catch {
          thumbnailUrl = null;
        }

        const videoUpload = await uploadPostVideo(selectedVideo.uri);
        await createPost({
          aspectRatio,
          content,
          imageUrls: [],
          video: {
            assetId: videoUpload.assetId,
            durationSeconds: selectedVideo.durationSeconds,
            provider: videoUpload.provider,
            status: videoUpload.status,
            thumbnailUrl: thumbnailUrl ?? videoUpload.thumbnailUrl,
            url: videoUpload.playbackUrl,
          },
          visibility,
        });
      } else {
        const imageUrls =
          imageUris.length > 0 ? await uploadPostImages(imageUris) : [];
        await createPost({
          aspectRatio,
          content,
          imageUrls,
          visibility,
        });
      }

      resetForm();
      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "게시물 작성에 실패했습니다.",
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    aspectRatio,
    canSubmit,
    content,
    errorMessage,
    hasDraft,
    imageUris,
    isSubmitting,
    replaceImages,
    replaceVideo,
    removeImage,
    removeVideo,
    resetForm,
    selectedVideo,
    setAspectRatio,
    setContent,
    setVisibility,
    submit,
    visibility,
  };
}
