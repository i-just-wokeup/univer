import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

import type { PostMediaCropTransform } from "../../features/feed/postMediaCrop";
import type { PostLibraryPhoto } from "../../features/feed/postMediaLibrary";
import { useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { PostMediaCropGrid } from "./PostMediaCropGrid";
import { usePostMediaCropGesture } from "./usePostMediaCropGesture";
import type { PostMediaCropSurfaceSize } from "./usePostMediaCropGesture";

type PostMediaCropSurfaceProps = {
  cropTransform: PostMediaCropTransform;
  onChangeCropTransform: (transform: PostMediaCropTransform) => void;
  photo: PostLibraryPhoto;
};

export function PostMediaCropSurface({
  cropTransform,
  onChangeCropTransform,
  photo,
}: PostMediaCropSurfaceProps) {
  const styles = useThemedStyles(makeStyles);
  const [frameSize, setFrameSize] = useState<PostMediaCropSurfaceSize>({
    height: 0,
    width: 0,
  });
  const baseSize = useMemo(() => {
    if (
      frameSize.width <= 0 ||
      frameSize.height <= 0 ||
      photo.width <= 0 ||
      photo.height <= 0
    ) {
      return { height: 0, width: 0 };
    }

    const coverScale = Math.max(
      frameSize.width / photo.width,
      frameSize.height / photo.height,
    );
    return {
      height: photo.height * coverScale,
      width: photo.width * coverScale,
    };
  }, [frameSize.height, frameSize.width, photo.height, photo.width]);
  const { gesture, gridOpacity, scaleStyle, translationStyle } =
    usePostMediaCropGesture({
      baseSize,
      cropTransform,
      frameSize,
      onChangeCropTransform,
      resetKey: photo.id,
    });

  function handleLayout(event: LayoutChangeEvent) {
    const { height, width } = event.nativeEvent.layout;
    setFrameSize((currentSize) =>
      currentSize.width === width && currentSize.height === height
        ? currentSize
        : { height, width },
    );
  }

  return (
    <View onLayout={handleLayout} style={styles.container}>
      {baseSize.width > 0 && baseSize.height > 0 ? (
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.gestureLayer, translationStyle]}>
            <Animated.View
              style={[
                styles.imageLayer,
                {
                  height: baseSize.height,
                  left: (frameSize.width - baseSize.width) / 2,
                  top: (frameSize.height - baseSize.height) / 2,
                  width: baseSize.width,
                },
                scaleStyle,
              ]}
            >
              <Image
                cachePolicy="memory-disk"
                contentFit="cover"
                recyclingKey={photo.id}
                source={{ uri: photo.uri }}
                style={styles.image}
                transition={100}
              />
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      ) : null}
      <PostMediaCropGrid opacity={gridOpacity} />
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    backgroundColor: c.imagePlaceholder,
  },
  gestureLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  imageLayer: {
    position: "absolute",
  },
  image: {
    height: "100%",
    width: "100%",
  },
});
