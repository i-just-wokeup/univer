import { getThumbnailAsync } from "expo-video-thumbnails";
import { useEffect, useState } from "react";

import {
  resolvePostLibraryAssetUri,
  type PostLibraryVideo,
} from "./postMediaLibrary";

const pendingTasks: Array<() => void> = [];
const MAX_CONCURRENT_THUMBNAILS = 1;
const THUMBNAIL_LOAD_DELAY_MS = 180;
let activeTaskCount = 0;
const thumbnailUriCache = new Map<string, string>();

function runThumbnailTask<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      activeTaskCount += 1;
      void task()
        .then(resolve, reject)
        .finally(() => {
          activeTaskCount -= 1;
          pendingTasks.shift()?.();
        });
    };

    if (activeTaskCount < MAX_CONCURRENT_THUMBNAILS) {
      run();
    } else {
      pendingTasks.push(run);
    }
  });
}

async function generateVideoThumbnail(
  video: PostLibraryVideo,
  isCancelled: () => boolean,
): Promise<string | null> {
  return runThumbnailTask(async () => {
    if (isCancelled()) {
      return null;
    }

    const cachedUri = thumbnailUriCache.get(video.id);
    if (cachedUri) {
      return cachedUri;
    }

    try {
      const resolvedUri = await resolvePostLibraryAssetUri(video);

      if (isCancelled()) {
        return null;
      }

      const thumbnail = await getThumbnailAsync(resolvedUri, {
        quality: 0.7,
        time: 0,
      });
      thumbnailUriCache.set(video.id, thumbnail.uri);
      return thumbnail.uri;
    } catch {
      return null;
    }
  });
}

export function usePostLibraryVideoThumbnail(
  video: PostLibraryVideo | null,
  enabled = true,
): string | null {
  const [thumbnailState, setThumbnailState] = useState<{
    thumbnailUri: string;
    videoId: string;
  } | null>(() => {
    if (!video) {
      return null;
    }

    const cachedUri = thumbnailUriCache.get(video.id);
    return cachedUri ? { thumbnailUri: cachedUri, videoId: video.id } : null;
  });

  useEffect(() => {
    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cachedUri = video ? thumbnailUriCache.get(video.id) : null;
    setThumbnailState((current) => {
      if (current?.videoId === video?.id) {
        return current;
      }
      return video && cachedUri
        ? { thumbnailUri: cachedUri, videoId: video.id }
        : null;
    });

    if (video && enabled && !cachedUri) {
      timeoutId = setTimeout(() => {
        void generateVideoThumbnail(video, () => isCancelled).then((result) => {
          if (!isCancelled && result) {
            setThumbnailState({ thumbnailUri: result, videoId: video.id });
          }
        });
      }, THUMBNAIL_LOAD_DELAY_MS);
    }

    return () => {
      isCancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [enabled, video]);

  return video && thumbnailState?.videoId === video.id
    ? thumbnailState.thumbnailUri
    : null;
}
