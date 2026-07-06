import { useState } from "react";
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

import { DoubleTapLike } from "../common/DoubleTapLike";
import { colors } from "../../lib/theme";
import { getAspectRatioValue } from "../../lib/utils/aspectRatio";
import type { PostAspectRatio, PostMedia } from "../../features/feed/types";

type FeedImageCarouselProps = {
  aspectRatio: PostAspectRatio;
  images: PostMedia[];
  onDoubleLike?: () => void;
};

export function FeedImageCarousel({
  aspectRatio,
  images,
  onDoubleLike,
}: FeedImageCarouselProps) {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const imageAspectRatio = getAspectRatioValue(aspectRatio);

  function handleMomentumScrollEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(
      Math.min(Math.max(nextIndex, 0), Math.max(images.length - 1, 0)),
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        horizontal
        keyExtractor={(mediaItem) => mediaItem.id}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        pagingEnabled
        renderItem={({ item }) =>
          onDoubleLike ? (
            <DoubleTapLike
              onDoubleTap={onDoubleLike}
              style={[styles.image, { aspectRatio: imageAspectRatio, width }]}
            >
              <Image
                cachePolicy="memory-disk"
                contentFit="cover"
                placeholderContentFit="cover"
                recyclingKey={item.id}
                source={{ uri: item.url }}
                style={StyleSheet.absoluteFill}
                transition={160}
              />
            </DoubleTapLike>
          ) : (
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              placeholderContentFit="cover"
              recyclingKey={item.id}
              source={{ uri: item.url }}
              style={[styles.image, { aspectRatio: imageAspectRatio, width }]}
              transition={160}
            />
          )
        }
        scrollEnabled={images.length > 1}
        showsHorizontalScrollIndicator={false}
      />
      {images.length > 1 ? (
        <View style={styles.mediaBadge}>
          <Text style={styles.mediaBadgeText}>
            {currentIndex + 1}/{images.length}
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
    fontSize: 12,
    fontWeight: "500",
  },
});
