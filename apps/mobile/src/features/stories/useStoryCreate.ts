import { getThumbnailAsync } from "expo-video-thumbnails";
import { useState } from "react";

import {
  createStory,
  createVideoStory,
  uploadStoryImage,
  uploadStoryVideo,
} from "./api";
import type { StoryVisibility } from "./types";

// 카메라/갤러리에서 받은 미디어 한 개. 영상이면 길이(초)를 같이 들고 온다.
export type StoryCaptureMedia = {
  durationSeconds: number | null;
  kind: "image" | "video";
  uri: string;
};

// 찍거나 고른 미디어의 미리보기/공개범위/업로드 상태. 업로드 성공 여부만 반환하고 화면 이동은 호출부가 한다.
export function useStoryCreate() {
  const [captured, setCaptured] = useState<StoryCaptureMedia | null>(null);
  const [visibility, setVisibility] = useState<StoryVisibility>("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function retake() {
    setCaptured(null);
    setErrorMessage("");
  }

  // 업로드 성공 시 true 반환(화면 이동은 호출부). 실패 시 false.
  async function submit(): Promise<boolean> {
    if (!captured || isSubmitting) {
      return false;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      if (captured.kind === "video") {
        // 포스터(썸네일)는 첫 프레임을 뽑아 이미지 버킷에 올린다. 실패해도 영상은 올린다.
        let thumbnailUrl: string | null = null;
        try {
          const thumbnail = await getThumbnailAsync(captured.uri, { time: 0 });
          thumbnailUrl = await uploadStoryImage(thumbnail.uri);
        } catch {
          thumbnailUrl = null;
        }

        const videoUrl = await uploadStoryVideo(captured.uri);
        await createVideoStory({
          durationSeconds: captured.durationSeconds,
          thumbnailUrl,
          videoUrl,
          visibility,
        });
      } else {
        const imageUrl = await uploadStoryImage(captured.uri);
        await createStory(imageUrl, visibility);
      }

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
    captured,
    errorMessage,
    isSubmitting,
    retake,
    setCaptured,
    setVisibility,
    submit,
    visibility,
  };
}
