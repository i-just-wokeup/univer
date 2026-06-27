import { useState } from "react";

import { createStory, uploadStoryImage } from "./api";
import type { StoryVisibility } from "./types";

// 찍거나 고른 사진의 미리보기/공개범위/업로드 상태. 업로드 성공 여부만 반환하고 화면 이동은 호출부가 한다.
export function useStoryCreate() {
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<StoryVisibility>("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function retake() {
    setCapturedUri(null);
    setErrorMessage("");
  }

  // 업로드 성공 시 true 반환(화면 이동은 호출부). 실패 시 false.
  async function submit(): Promise<boolean> {
    if (!capturedUri || isSubmitting) {
      return false;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const imageUrl = await uploadStoryImage(capturedUri);
      await createStory(imageUrl, visibility);

      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "스토리 업로드에 실패했습니다.",
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    capturedUri,
    errorMessage,
    isSubmitting,
    retake,
    setCapturedUri,
    setVisibility,
    submit,
    visibility,
  };
}
