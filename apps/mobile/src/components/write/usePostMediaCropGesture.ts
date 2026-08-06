import { useEffect } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import {
  MAX_POST_MEDIA_CROP_SCALE,
  normalizePostMediaCropTransform,
} from "../../features/feed/postMediaCrop";
import type { PostMediaCropTransform } from "../../features/feed/postMediaCrop";

export type PostMediaCropSurfaceSize = {
  height: number;
  width: number;
};

type UsePostMediaCropGestureParams = {
  baseSize: PostMediaCropSurfaceSize;
  cropTransform: PostMediaCropTransform;
  frameSize: PostMediaCropSurfaceSize;
  onChangeCropTransform: (transform: PostMediaCropTransform) => void;
  resetKey: string;
};

function clamp(value: number, min: number, max: number): number {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

function getMaxTranslation(
  contentSize: number,
  frameSize: number,
  scale: number,
): number {
  "worklet";
  return Math.max(0, (contentSize * scale - frameSize) / 2);
}

export function usePostMediaCropGesture({
  baseSize,
  cropTransform,
  frameSize,
  onChangeCropTransform,
  resetKey,
}: UsePostMediaCropGestureParams) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);
  const pinchStartScale = useSharedValue(1);
  const pinchStartX = useSharedValue(0);
  const pinchStartY = useSharedValue(0);
  const pinchFocalX = useSharedValue(0);
  const pinchFocalY = useSharedValue(0);

  useEffect(() => {
    if (baseSize.width <= 0 || baseSize.height <= 0) {
      return;
    }

    const normalized = normalizePostMediaCropTransform(cropTransform);
    const maxX = getMaxTranslation(
      baseSize.width,
      frameSize.width,
      normalized.scale,
    );
    const maxY = getMaxTranslation(
      baseSize.height,
      frameSize.height,
      normalized.scale,
    );
    scale.value = normalized.scale;
    translateX.value = normalized.offsetX * maxX;
    translateY.value = normalized.offsetY * maxY;
  }, [
    baseSize.height,
    baseSize.width,
    cropTransform,
    frameSize.height,
    frameSize.width,
    resetKey,
    scale,
    translateX,
    translateY,
  ]);

  function commitTransform(
    nextScale: number,
    nextTranslateX: number,
    nextTranslateY: number,
  ) {
    const maxX = getMaxTranslation(
      baseSize.width,
      frameSize.width,
      nextScale,
    );
    const maxY = getMaxTranslation(
      baseSize.height,
      frameSize.height,
      nextScale,
    );
    onChangeCropTransform({
      offsetX: maxX > 0 ? clamp(nextTranslateX / maxX, -1, 1) : 0,
      offsetY: maxY > 0 ? clamp(nextTranslateY / maxY, -1, 1) : 0,
      scale: nextScale,
    });
  }

  const panGesture = Gesture.Pan()
    .maxPointers(1)
    .onStart(() => {
      panStartX.value = translateX.value;
      panStartY.value = translateY.value;
    })
    .onUpdate((event) => {
      const maxX = getMaxTranslation(
        baseSize.width,
        frameSize.width,
        scale.value,
      );
      const maxY = getMaxTranslation(
        baseSize.height,
        frameSize.height,
        scale.value,
      );
      translateX.value = clamp(
        panStartX.value + event.translationX,
        -maxX,
        maxX,
      );
      translateY.value = clamp(
        panStartY.value + event.translationY,
        -maxY,
        maxY,
      );
    })
    .onEnd(() => {
      runOnJS(commitTransform)(
        scale.value,
        translateX.value,
        translateY.value,
      );
    });

  const pinchGesture = Gesture.Pinch()
    .onStart((event) => {
      pinchStartScale.value = scale.value;
      pinchStartX.value = translateX.value;
      pinchStartY.value = translateY.value;
      pinchFocalX.value = event.focalX - frameSize.width / 2;
      pinchFocalY.value = event.focalY - frameSize.height / 2;
    })
    .onUpdate((event) => {
      const nextScale = clamp(
        pinchStartScale.value * event.scale,
        1,
        MAX_POST_MEDIA_CROP_SCALE,
      );
      const scaleDelta = nextScale / pinchStartScale.value;
      const nextTranslateX =
        pinchFocalX.value +
        (pinchStartX.value - pinchFocalX.value) * scaleDelta;
      const nextTranslateY =
        pinchFocalY.value +
        (pinchStartY.value - pinchFocalY.value) * scaleDelta;
      const maxX = getMaxTranslation(
        baseSize.width,
        frameSize.width,
        nextScale,
      );
      const maxY = getMaxTranslation(
        baseSize.height,
        frameSize.height,
        nextScale,
      );

      scale.value = nextScale;
      translateX.value = clamp(nextTranslateX, -maxX, maxX);
      translateY.value = clamp(nextTranslateY, -maxY, maxY);
    })
    .onEnd(() => {
      runOnJS(commitTransform)(
        scale.value,
        translateX.value,
        translateY.value,
      );
    });

  const translationStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    gesture: Gesture.Simultaneous(panGesture, pinchGesture),
    scaleStyle,
    translationStyle,
  };
}
