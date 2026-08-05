import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { getThumbnailAsync } from "expo-video-thumbnails";
import { useState } from "react";

import { createPost, uploadPostImages, uploadPostVideo } from "./api";
import type { PostAspectRatio, PostVisibility } from "./types";

export const MAX_IMAGES = 10;
// 릴스/피드 영상 업로드 제한. 길이는 비용/인코딩을, 용량은 업로드 안정성을 위해 사전 차단.
const MAX_VIDEO_DURATION_SECONDS = 60;
const MAX_VIDEO_SIZE_BYTES = 250 * 1024 * 1024;

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

  async function pickVideo() {
    setErrorMessage("");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setErrorMessage("영상 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ["videos"],
      quality: 1,
    });

    if (result.canceled) {
      return;
    }

    const [asset] = result.assets;

    if (!asset) {
      return;
    }

    // 길이 제한: 60초 초과면 업로드 전에 차단.
    if (
      typeof asset.duration === "number" &&
      asset.duration > MAX_VIDEO_DURATION_SECONDS * 1000
    ) {
      setErrorMessage(
        `${MAX_VIDEO_DURATION_SECONDS}초 이하 영상만 올릴 수 있어요.`,
      );
      return;
    }

    // 용량 제한: 250MB 초과면 차단(파일 크기 확인 실패 시엔 통과시켜 업로드 시도).
    try {
      const info = await FileSystem.getInfoAsync(asset.uri);
      if (info.exists && info.size > MAX_VIDEO_SIZE_BYTES) {
        setErrorMessage("영상 용량이 너무 커요. (250MB 이하)");
        return;
      }
    } catch {
      // 크기 확인 실패는 무시하고 업로드 진행(서버/타임아웃이 최종 방어).
    }

    setImageUris([]);
    setSelectedVideo({
      durationSeconds:
        typeof asset.duration === "number" ? Math.round(asset.duration / 1000) : null,
      uri: asset.uri,
    });
    setAspectRatio(detectAspectRatio(asset.width, asset.height));
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
    pickVideo,
    replaceImages,
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
