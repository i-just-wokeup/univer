import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

import { createPost, uploadPostImages } from "./api";
import type { PostAspectRatio, PostVisibility } from "./types";

export const MAX_IMAGES = 10;

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
  const [aspectRatio, setAspectRatio] = useState<PostAspectRatio>("square");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const canSubmit =
    !isSubmitting && (imageUris.length > 0 || content.trim().length > 0);
  const hasDraft = imageUris.length > 0 || content.trim().length > 0;

  function resetForm() {
    setImageUris([]);
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

  function removeImage(index: number) {
    setImageUris((currentUris) =>
      currentUris.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  // 작성 성공 시 true 반환(화면 이동은 호출부). 실패 시 false.
  async function submit(): Promise<boolean> {
    if (!canSubmit) {
      return false;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const imageUrls =
        imageUris.length > 0 ? await uploadPostImages(imageUris) : [];
      await createPost({
        aspectRatio,
        content,
        imageUrls,
        visibility,
      });

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
    removeImage,
    resetForm,
    setAspectRatio,
    setContent,
    setVisibility,
    submit,
    visibility,
  };
}
