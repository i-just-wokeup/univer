import { getThumbnailAsync } from "expo-video-thumbnails";
import { useEffect, useState } from "react";

import {
  createStory,
  createVideoStory,
  getStorySharedPostPreview,
  uploadStoryImage,
  uploadStoryVideo,
} from "./api";
import { DEFAULT_STORY_BACKGROUND_COLOR } from "./backgroundColors";
import type { StorySharedPost, StoryVisibility } from "./types";

// 카메라/갤러리에서 받은 미디어 한 개. 영상이면 길이(초)를 같이 들고 온다.
export type StoryCaptureMedia = {
  durationSeconds: number | null;
  kind: "image" | "video";
  uri: string;
};

// 찍거나 고른 미디어의 미리보기/공개범위/업로드 상태. 업로드 성공 여부만 반환하고 화면 이동은 호출부가 한다.
export function useStoryCreate(sharedPostId?: string) {
  const [captured, setCaptured] = useState<StoryCaptureMedia | null>(null);
  const [backgroundColor, setBackgroundColor] = useState(
    DEFAULT_STORY_BACKGROUND_COLOR,
  );
  const [visibility, setVisibility] = useState<StoryVisibility>("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSharedPostLoading, setIsSharedPostLoading] = useState(
    Boolean(sharedPostId),
  );
  const [sharedPost, setSharedPost] = useState<StorySharedPost | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    if (!sharedPostId) {
      setSharedPost(null);
      setIsSharedPostLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setIsSharedPostLoading(true);
    setSharedPost(null);
    setErrorMessage("");
    void getStorySharedPostPreview(sharedPostId)
      .then((post) => {
        if (isMounted) {
          setSharedPost(post);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setSharedPost(null);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "게시물을 불러오지 못했습니다.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsSharedPostLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sharedPostId]);

  function retake() {
    setCaptured(null);
    setErrorMessage("");
  }

  // 업로드 성공 시 true 반환(화면 이동은 호출부). 실패 시 false.
  async function submit(): Promise<boolean> {
    if ((!captured && !sharedPost) || isSubmitting) {
      return false;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      if (sharedPost) {
        await createStory(null, visibility, backgroundColor, sharedPost.id);
      } else if (captured?.kind === "video") {
        // 포스터(썸네일)는 첫 프레임을 뽑아 이미지 버킷에 올린다. 실패해도 영상은 올린다.
        let thumbnailUrl: string | null = null;
        try {
          const thumbnail = await getThumbnailAsync(captured.uri, { time: 0 });
          thumbnailUrl = await uploadStoryImage(thumbnail.uri);
        } catch {
          thumbnailUrl = null;
        }

        const videoUpload = await uploadStoryVideo(captured.uri);
        await createVideoStory({
          assetId: videoUpload.assetId,
          backgroundColor,
          durationSeconds: captured.durationSeconds,
          provider: videoUpload.provider,
          status: videoUpload.status,
          thumbnailUrl: thumbnailUrl ?? videoUpload.thumbnailUrl,
          videoUrl: videoUpload.playbackUrl,
          visibility,
        });
      } else if (captured) {
        const imageUrl = await uploadStoryImage(captured.uri);
        await createStory(imageUrl, visibility, backgroundColor);
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
    backgroundColor,
    captured,
    errorMessage,
    isSubmitting,
    isSharedPostLoading,
    retake,
    setBackgroundColor,
    setCaptured,
    setVisibility,
    sharedPost,
    submit,
    visibility,
  };
}
