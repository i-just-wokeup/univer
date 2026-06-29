import { useMemo, useState } from "react";
import { Image } from "expo-image";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { FeedVideoPlayer } from "./FeedVideoPlayer";
import { colors } from "../../lib/theme";
import { getAspectRatioValue } from "../../lib/utils/aspectRatio";
import type { PostAspectRatio, PostMedia } from "../../features/feed/types";

type FeedMediaCarouselProps = {
  aspectRatio: PostAspectRatio;
  isActive?: boolean;
  media: PostMedia[];
};

export function FeedMediaCarousel({
  aspectRatio,
  isActive = false,
  media,
}: FeedMediaCarouselProps) {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
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
        thumbnailUrl={videoMedia.thumbnail_url}
        uri={videoMedia.url}
      />
    );
  }

  if (imageMedia.length === 0) {
    return null;
  }

  const imageAspectRatio = getAspectRatioValue(aspectRatio);

  function handleMomentumScrollEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(
      Math.min(Math.max(nextIndex, 0), Math.max(imageMedia.length - 1, 0)),
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={imageMedia}
        horizontal
        keyExtractor={(mediaItem) => mediaItem.id}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        pagingEnabled
        renderItem={({ item }) => (
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            placeholderContentFit="cover"
            recyclingKey={item.id}
            source={{ uri: item.url }}
            style={[styles.image, { aspectRatio: imageAspectRatio, width }]}
            transition={160}
          />
        )}
        scrollEnabled={imageMedia.length > 1}
        showsHorizontalScrollIndicator={false}
      />
      {imageMedia.length > 1 ? (
        <View style={styles.mediaBadge}>
          <Text style={styles.mediaBadgeText}>
            {currentIndex + 1}/{imageMedia.length}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.imagePlaceholder,
  },
  image: {
    backgroundColor: colors.imagePlaceholder,
  },
  mediaBadge: {
    position: "absolute",
    right: 18,
    top: 18,
    borderRadius: 999,
    backgroundColor: "rgba(21,22,27,0.72)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mediaBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
});
