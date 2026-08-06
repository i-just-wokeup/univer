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
        renderItem={({ item, index }) => {
          const isFocused = item.id === previewPhotoId;
          return (
            <Pressable
              accessibilityLabel={`선택한 ${index + 1}번째 사진 크롭`}
              accessibilityRole="button"
              onPress={() => onFocusPhoto(item.id)}
              style={({ pressed }) => [
                styles.thumbnailButton,
                isFocused ? styles.thumbnailButtonFocused : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Image
                cachePolicy="memory-disk"
                contentFit="cover"
                recyclingKey={item.id}
                source={{ uri: item.uri }}
                style={styles.thumbnail}
                transition={100}
              />
            </Pressable>
          );
        }}
        showsHorizontalScrollIndicator={false}
      />
    </Animated.View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: c.accentSoft,
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
  thumbnailButtonFocused: {
    borderWidth: 2,
    borderColor: c.accent,
    padding: 2,
  },
  thumbnail: {
    height: "100%",
    width: "100%",
    borderRadius: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
