import * as ImagePicker from "expo-image-picker";
import { getThumbnailAsync } from "expo-video-thumbnails";
import { useState } from "react";

import { createPost, uploadPostImages, uploadPostVideo } from "./api";
import type { PostAspectRatio, PostVisibility } from "./types";

export const MAX_IMAGES = 10;

type SelectedVideo = {
  durationSeconds: number | null;
  uri: string;
};

function detectAspectRatio(width?: number, height?: number): PostAspectRatio {
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

  async function pickImages() {
    setErrorMessage("");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setErrorMessage("사진 접근 권한이 필요합니다.");
      return;
    }

    setSelectedVideo(null);

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ["images"],
      quality: 1,
      selectionLimit: MAX_IMAGES,
    });

    if (result.canceled) {
      return;
    }

    const selectedAssets = result.assets.slice(
      0,
      Math.max(0, MAX_IMAGES - imageUris.length),
    );

    if (selectedAssets.length === 0) {
      return;
    }

    if (imageUris.length === 0) {
      const firstAsset = selectedAssets[0];
      setAspectRatio(detectAspectRatio(firstAsset.width, firstAsset.height));
    }

    setImageUris((currentUris) => [
      ...currentUris,
      ...selectedAssets.map((asset) => asset.uri),
    ]);
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

        const videoUrl = await uploadPostVideo(selectedVideo.uri);
        await createPost({
          aspectRatio,
          content,
          imageUrls: [],
          video: {
            durationSeconds: selectedVideo.durationSeconds,
            thumbnailUrl,
            url: videoUrl,
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
    pickImages,
    pickVideo,
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
