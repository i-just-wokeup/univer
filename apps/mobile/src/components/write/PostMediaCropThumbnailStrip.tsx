import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import {
  Gesture,
  GestureDetector,
  ScrollView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import type { PostLibraryPhoto } from "../../features/feed/postMediaLibrary";
import { spacing, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

const STRIP_HEIGHT = 72;
const THUMBNAIL_SIZE = 52;
// 한 칸 이동 거리 = 썸네일 + 간격. 손가락이 이만큼 움직이면 한 자리 이동이다.
const SLOT_WIDTH = THUMBNAIL_SIZE + spacing.sm;
// 길게 누르기 대기 시간. 이 시간 안에 손가락이 움직이면 제스처가 실패하고
// 가로 스크롤이나 바텀시트가 대신 가져간다(RNGH PanGestureHandler 동작).
const LONG_PRESS_MS = 300;

type PostMediaCropThumbnailStripProps = {
  isVisible: boolean;
  onFocusPhoto: (photoId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  photos: PostLibraryPhoto[];
  previewPhotoId: string | null;
};

type ThumbnailProps = {
  activeIndex: SharedValue<number>;
  dragX: SharedValue<number>;
  index: number;
  isFocused: boolean;
  lastIndex: number;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
  onDragStart: (photoId: string) => void;
  onPress: () => void;
  photo: PostLibraryPhoto;
  styles: ReturnType<typeof makeStyles>;
};

function clampIndex(value: number, lastIndex: number): number {
  "worklet";
  return Math.min(lastIndex, Math.max(0, value));
}

function Thumbnail({
  activeIndex,
  dragX,
  index,
  isFocused,
  lastIndex,
  onDragEnd,
  onDragStart,
  onPress,
  photo,
  styles,
}: ThumbnailProps) {
  // 길게 누르기 전에 손가락이 움직이면 제스처가 실패한다. 그래서 짧은 탭,
  // 가로 스크롤, 시트 여닫기가 지금처럼 그대로 동작한다.
  const dragGesture = Gesture.Pan()
    .activateAfterLongPress(LONG_PRESS_MS)
    .onStart(() => {
      activeIndex.value = index;
      dragX.value = 0;
      runOnJS(onDragStart)(photo.id);
    })
    .onUpdate((event) => {
      dragX.value = event.translationX;
    })
    .onEnd(() => {
      const target = clampIndex(
        index + Math.round(dragX.value / SLOT_WIDTH),
        lastIndex,
      );
      runOnJS(onDragEnd)(index, target);
    })
    .onFinalize(() => {
      activeIndex.value = -1;
      dragX.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => {
    const from = activeIndex.value;

    // 집어 든 썸네일: 손가락을 그대로 따라가고, 커지면서 위로 뜬다.
    if (from === index) {
      return {
        transform: [{ translateX: dragX.value }, { scale: 1.08 }],
        zIndex: 2,
        elevation: 6,
      };
    }

    if (from < 0) {
      return { transform: [{ translateX: 0 }], zIndex: 0, elevation: 0 };
    }

    // 나머지 썸네일: 들어갈 빈자리를 만들어 준다.
    const target = clampIndex(
      from + Math.round(dragX.value / SLOT_WIDTH),
      lastIndex,
    );
    let shift = 0;
    if (from < target && index > from && index <= target) {
      shift = -SLOT_WIDTH;
    } else if (from > target && index >= target && index < from) {
      shift = SLOT_WIDTH;
    }

    return {
      transform: [{ translateX: withTiming(shift, { duration: 140 }) }],
      zIndex: 0,
      elevation: 0,
    };
  });

  return (
    <GestureDetector gesture={dragGesture}>
      <Animated.View style={animatedStyle}>
        <Pressable
          accessibilityLabel={`선택한 ${index + 1}번째 사진 크롭`}
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [
            styles.thumbnailButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Image
            allowDownscaling
            cachePolicy="memory-disk"
            contentFit="cover"
            recyclingKey={photo.id}
            source={{ uri: photo.uri }}
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
      </Animated.View>
    </GestureDetector>
  );
}

export function PostMediaCropThumbnailStrip({
  isVisible,
  onFocusPhoto,
  onReorder,
  photos,
  previewPhotoId,
}: PostMediaCropThumbnailStripProps) {
  const styles = useThemedStyles(makeStyles);
  const visibility = useSharedValue(isVisible ? 1 : 0);
  const activeIndex = useSharedValue(-1);
  const dragX = useSharedValue(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    visibility.value = withTiming(isVisible ? 1 : 0, { duration: 200 });
  }, [isVisible, visibility]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: STRIP_HEIGHT * visibility.value,
    opacity: visibility.value,
  }));

  function handleDragStart(photoId: string) {
    setIsDragging(true);
    // 끌고 있는 사진을 위 미리보기에도 띄워 어떤 사진인지 분명히 한다.
    onFocusPhoto(photoId);
  }

  function handleDragEnd(fromIndex: number, toIndex: number) {
    setIsDragging(false);
    if (fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }
  }

  return (
    <Animated.View
      accessibilityElementsHidden={!isVisible}
      importantForAccessibility={isVisible ? "auto" : "no-hide-descendants"}
      pointerEvents={isVisible ? "auto" : "none"}
      style={[styles.container, animatedStyle]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        horizontal
        // 끌고 있는 동안에는 목록이 같이 움직이지 않게 막는다.
        scrollEnabled={!isDragging}
        showsHorizontalScrollIndicator={false}
        style={styles.list}
      >
        {photos.map((photo, index) => (
          <Thumbnail
            activeIndex={activeIndex}
            dragX={dragX}
            index={index}
            isFocused={photo.id === previewPhotoId}
            key={photo.id}
            lastIndex={photos.length - 1}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            onPress={() => onFocusPhoto(photo.id)}
            photo={photo}
            styles={styles}
          />
        ))}
      </ScrollView>
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
