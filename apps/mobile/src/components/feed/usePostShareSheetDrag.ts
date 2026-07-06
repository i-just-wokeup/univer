import { useCallback, useEffect, useMemo, useRef } from "react";
import { Animated, PanResponder, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HALF_SNAP_RATIO = 0.55;
const FULL_SNAP_RATIO = 0.92;
const CLOSE_DISTANCE = 88;
const CLOSE_VELOCITY = 1;
const EXPAND_VELOCITY = -0.6;

type UsePostShareSheetDragParams = {
  isOpen: boolean;
  onClose: () => void;
};

export function usePostShareSheetDrag({
  isOpen,
  onClose,
}: UsePostShareSheetDragParams) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const fullSnapHeight = Math.round(windowHeight * FULL_SNAP_RATIO);
  const halfSnapHeight = Math.round(windowHeight * HALF_SNAP_RATIO);
  const halfSnapOffset = fullSnapHeight - halfSnapHeight;
  const closedOffset = fullSnapHeight + insets.bottom + 24;
  const translateY = useRef(new Animated.Value(closedOffset)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const isClosingRef = useRef(false);
  const gestureStartYRef = useRef(closedOffset);

  const animateTo = useCallback(
    (toValue: number) => {
      Animated.spring(translateY, {
        damping: 25,
        mass: 0.75,
        stiffness: 280,
        toValue,
        useNativeDriver: true,
      }).start();
    },
    [translateY],
  );

  const closeWithAnimation = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    Animated.parallel([
      Animated.timing(translateY, {
        duration: 200,
        toValue: closedOffset,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        duration: 200,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isClosingRef.current = false;
      onClose();
    });
  }, [backdropOpacity, closedOffset, onClose, translateY]);

  const settleSheet = useCallback(
    (currentY: number, velocityY: number) => {
      if (
        currentY > halfSnapOffset + CLOSE_DISTANCE ||
        (velocityY > CLOSE_VELOCITY && currentY > halfSnapOffset)
      ) {
        closeWithAnimation();
        return;
      }

      if (currentY < halfSnapOffset * 0.55 || velocityY < EXPAND_VELOCITY) {
        animateTo(0);
        return;
      }

      animateTo(halfSnapOffset);
    },
    [animateTo, closeWithAnimation, halfSnapOffset],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Math.abs(gestureState.dy) > 4 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderGrant: () => {
          translateY.stopAnimation((value) => {
            gestureStartYRef.current = value;
          });
        },
        onPanResponderMove: (_event, gestureState) => {
          const nextValue = Math.min(
            closedOffset,
            Math.max(0, gestureStartYRef.current + gestureState.dy),
          );
          translateY.setValue(nextValue);
        },
        onPanResponderRelease: (_event, gestureState) => {
          const nextValue = Math.min(
            closedOffset,
            Math.max(0, gestureStartYRef.current + gestureState.dy),
          );
          settleSheet(nextValue, gestureState.vy);
        },
        onPanResponderTerminate: () => animateTo(halfSnapOffset),
        onPanResponderTerminationRequest: () => false,
      }),
    [animateTo, closedOffset, halfSnapOffset, settleSheet, translateY],
  );

  // 열릴 때마다 화면 밖에서 시작해 반쯤 열린 detent로 슬라이드-인 + 배경 딤 페이드-인.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    isClosingRef.current = false;
    gestureStartYRef.current = halfSnapOffset;
    translateY.setValue(closedOffset);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, {
        duration: 260,
        toValue: halfSnapOffset,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        duration: 260,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, closedOffset, halfSnapOffset, isOpen, translateY]);

  return {
    backdropOpacity,
    closeWithAnimation,
    fullSnapHeight,
    insets,
    panHandlers: panResponder.panHandlers,
    translateY,
  };
}
