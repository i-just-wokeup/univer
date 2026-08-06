import { Image } from "expo-image";
import { useEffect } from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import type { PostLibraryPhoto } from "../../features/feed/postMediaLibrary";
import { spacing, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

const STRIP_HEIGHT = 72;
const THUMBNAIL_SIZE = 52;

type PostMediaCropThumbnailStripProps = {
  isVisible: boolean;
  onFocusPhoto: (photoId: string) => void;
  photos: PostLibraryPhoto[];
  previewPhotoId: string | null;
};

export function PostMediaCropThumbnailStrip({
  isVisible,
  onFocusPhoto,
  photos,
  previewPhotoId,
}: PostMediaCropThumbnailStripProps) {
  const styles = useThemedStyles(makeStyles);
  const visibility = useSharedValue(isVisible ? 1 : 0);

  useEffect(() => {
    visibility.value = withTiming(isVisible ? 1 : 0, { duration: 200 });
  }, [isVisible, visibility]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: STRIP_HEIGHT * visibility.value,
    opacity: visibility.value,
  }));

  return (
    <Animated.View
      accessibilityElementsHidden={!isVisible}
      importantForAccessibility={isVisible ? "auto" : "no-hide-descendants"}
      pointerEvents={isVisible ? "auto" : "none"}
      style={[styles.container, animatedStyle]}
    >
      <FlatList
        contentContainerStyle={styles.content}
        data={photos}
        extraData={previewPhotoId}
        horizontal
        keyExtractor={(photo) => photo.id}
        removeClippedSubviews={false}
        renderItem={({ item, index }) => {
          const isFocused = item.id === previewPhotoId;
          return (
            <Pressable
              accessibilityLabel={`선택한 ${index + 1}번째 사진 크롭`}
              accessibilityRole="button"
              onPress={() => onFocusPhoto(item.id)}
              style={({ pressed }) => [
                styles.thumbnailButton,
                pressed ? styles.pressed : null,
              ]}
            >
              <Image
                allowDownscaling
                cachePolicy="memory-disk"
                contentFit="cover"
                recyclingKey={item.id}
                source={{ uri: item.uri }}
                style={styles.thumbnail}
                transition={100}
              />
              {isFocused ? (
                <Animated.View
                  pointerEvents="none"
                  style={styles.thumbnailFocusRing}
                />
              ) : null}
            </Pressable>
          );
        }}
        showsHorizontalScrollIndicator={false}
        style={styles.list}
      />
    </Animated.View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: c.accentSoft,
  },
  list: {
    height: STRIP_HEIGHT,
    flexGrow: 0,
  },
  content: {
    minHeight: STRIP_HEIGHT,
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: (STRIP_HEIGHT - THUMBNAIL_SIZE) / 2,
  },
  thumbnailButton: {
    height: THUMBNAIL_SIZE,
    width: THUMBNAIL_SIZE,
    overflow: "hidden",
    borderRadius: 6,
    backgroundColor: c.imagePlaceholder,
  },
  thumbnail: {
    height: THUMBNAIL_SIZE,
    width: THUMBNAIL_SIZE,
  },
  thumbnailFocusRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: c.accent,
    borderRadius: 6,
  },
  pressed: {
    opacity: 0.7,
  },
});
