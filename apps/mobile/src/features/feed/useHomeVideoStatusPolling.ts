import { useEffect, useMemo, type Dispatch, type SetStateAction } from "react";

import { getVideoStatuses } from "./videoStatus";
import type { FeedPost } from "./types";
import type { HomeFeedbackType } from "./useHomeFeedFeedback";

type UseHomeVideoStatusPollingParams = {
  posts: FeedPost[];
  setPosts: Dispatch<SetStateAction<FeedPost[]>>;
  showFeedback: (message: string, type: HomeFeedbackType) => void;
};

export function useHomeVideoStatusPolling({
  posts,
  setPosts,
  showFeedback,
}: UseHomeVideoStatusPollingParams) {
  const processingAssetKey = useMemo(
    () =>
      posts
        .flatMap((post) => post.media)
        .filter(
          (media) =>
            media.type === "video" &&
            media.provider === "cloudflare_stream" &&
            media.provider_asset_id !== null &&
            media.processing_status === "processing",
        )
        .map((media) => media.provider_asset_id)
        .sort()
        .join(","),
    [posts],
  );

  // 업로드 직후 Cloudflare 인코딩 중인 영상은 webhook을 놓쳐도 홈에서 자체 복구한다.
  useEffect(() => {
    if (!processingAssetKey) {
      return;
    }

    const assetIds = processingAssetKey.split(",");
    let attempts = 0;
    let isFetching = false;
    const MAX_ATTEMPTS = 45; // 4초 x 45 = 약 3분

    const intervalId = setInterval(async () => {
      if (isFetching) {
        return;
      }

      attempts += 1;
      isFetching = true;

      try {
        const statuses = await getVideoStatuses(assetIds);
        const resolved = statuses.filter(
          (status) => status.processingStatus !== "processing",
        );

        if (resolved.length > 0) {
          setPosts((currentPosts) =>
            currentPosts.map((post) => ({
              ...post,
              media: post.media.map((media) => {
                const update = resolved.find(
                  (status) =>
                    status.providerAssetId === media.provider_asset_id,
                );

                if (!update) {
                  return media;
                }

                return {
                  ...media,
                  processing_status: update.processingStatus,
                  thumbnail_url: update.thumbnailUrl ?? media.thumbnail_url,
                  url: update.url,
                };
              }),
            })),
          );

          if (resolved.some((status) => status.processingStatus === "ready")) {
            showFeedback("게시물 업로드가 완료됐어요", "success");
          }
        }
      } catch {
        // 폴링 실패는 다음 tick에서 다시 시도한다.
      } finally {
        isFetching = false;
      }

      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(intervalId);
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, [processingAssetKey, setPosts, showFeedback]);
}
