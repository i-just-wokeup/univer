import { useEffect, useMemo, useRef, useState } from "react";

import type {
  PostLibraryVideo,
  PreparedPostLibraryVideo,
} from "./postMediaLibrary";
import {
  preparePostLibraryVideo,
  resolvePostLibraryAssetUri,
} from "./postMediaLibrary";
import type { PostAspectRatio } from "./types";
import { usePostMediaLibrarySource } from "./usePostMediaLibrarySource";
import { detectAspectRatio } from "./useWriteForm";

type UsePostVideoLibraryPickerParams = {
  enabled: boolean;
};

export function usePostVideoLibraryPicker({
  enabled,
}: UsePostVideoLibraryPickerParams) {
  const source = usePostMediaLibrarySource("video", enabled);
  const videos = useMemo(
    () =>
      source.assets.filter(
        (asset): asset is PostLibraryVideo => asset.mediaType === "video",
      ),
    [source.assets],
  );
  const [selectedVideo, setSelectedVideo] =
    useState<PostLibraryVideo | null>(null);
  const [aspectRatio, setAspectRatio] = useState<PostAspectRatio>("portrait");
  const [isPreparing, setIsPreparing] = useState(false);
  const [selectionErrorMessage, setSelectionErrorMessage] = useState("");
  const [previewUriState, setPreviewUriState] = useState<{
    uri: string;
    videoId: string;
  } | null>(null);
  const hasInitializedSelectionRef = useRef(false);

  useEffect(() => {
    const firstVideo = videos[0];
    if (!enabled || hasInitializedSelectionRef.current || !firstVideo) {
      return;
    }

    hasInitializedSelectionRef.current = true;
    setSelectedVideo(firstVideo);
    setAspectRatio(detectAspectRatio(firstVideo.width, firstVideo.height));
  }, [enabled, videos]);

  useEffect(() => {
    let isCancelled = false;

    if (!enabled || !selectedVideo) {
      setPreviewUriState(null);
      return () => {
        isCancelled = true;
      };
    }

    setPreviewUriState(null);
    void resolvePostLibraryAssetUri(selectedVideo)
      .then((uri) => {
        if (!isCancelled) {
          setPreviewUriState({ uri, videoId: selectedVideo.id });
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSelectionErrorMessage("선택한 영상을 불러오지 못했습니다.");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [enabled, selectedVideo]);

  function selectVideo(video: PostLibraryVideo) {
    setSelectionErrorMessage("");
    source.clearErrorMessage();
    setSelectedVideo(video);
    setAspectRatio(detectAspectRatio(video.width, video.height));
  }

  async function resolveSelectedVideo(): Promise<
    PreparedPostLibraryVideo | null
  > {
    if (!selectedVideo) {
      return null;
    }

    setIsPreparing(true);
    setSelectionErrorMessage("");
    source.clearErrorMessage();

    try {
      return await preparePostLibraryVideo(selectedVideo);
    } catch (error) {
      setSelectionErrorMessage(
        error instanceof Error
          ? error.message
          : "선택한 영상을 준비하지 못했습니다.",
      );
      return null;
    } finally {
      setIsPreparing(false);
    }
  }

  return {
    ...source,
    aspectRatio,
    errorMessage: selectionErrorMessage || source.errorMessage,
    isPreparing,
    resolveSelectedVideo,
    selectVideo,
    selectedCount: selectedVideo ? 1 : 0,
    selectedVideo,
    selectedVideoPreviewUri:
      selectedVideo && previewUriState?.videoId === selectedVideo.id
        ? previewUriState.uri
        : null,
    videos,
  };
}
