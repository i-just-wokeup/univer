import { useMemo } from "react";

import { FeedImageCarousel } from "./FeedImageCarousel";
import { FeedVideoPlayer } from "./FeedVideoPlayer";
import type { PostAspectRatio, PostMedia } from "../../features/feed/types";

type FeedMediaCarouselProps = {
  aspectRatio: PostAspectRatio;
  isActive?: boolean;
  media: PostMedia[];
  // 사진/영상 더블탭 시 좋아요("이미 좋아요면 무시" 판단은 호출부).
  onDoubleLike?: () => void;
  onVideoPress?: () => void;
};

export function FeedMediaCarousel({
  aspectRatio,
  isActive = false,
  media,
  onDoubleLike,
  onVideoPress,
}: FeedMediaCarouselProps) {
  // 게시물은 영상 1개 OR 사진 여러 장. 영상이면 영상 플레이어로 렌더.
  const videoMedia = useMemo(
    () => media.find((mediaItem) => mediaItem.type === "video"),
    [media],
  );
  const imageMedia = useMemo(
    () => media.filter((mediaItem) => mediaItem.type === "image"),
    [media],
  );

  if (videoMedia) {
    return (
      <FeedVideoPlayer
        aspectRatio={aspectRatio}
        isActive={isActive}
        onDoubleLike={onDoubleLike}
        onPress={onVideoPress}
        processingStatus={videoMedia.processing_status}
        thumbnailUrl={videoMedia.thumbnail_url}
        uri={videoMedia.url}
      />
    );
  }

  if (imageMedia.length === 0) {
    return null;
  }

  return (
    <FeedImageCarousel
      aspectRatio={aspectRatio}
      images={imageMedia}
      onDoubleLike={onDoubleLike}
    />
  );
}
