import { useCallback, useEffect, useMemo, useRef } from "react";
import { Animated, PanResponder } from "react-native";

type UseCommentsSheetDragParams = {
  height: number;
  isOpen: boolean;
  onClose: () => void;
  postId: string | null;
};

// 댓글 시트의 아래로 끌어 닫기 제스처만 담당한다.
// 화면 컴포넌트는 translateY와 panHandlers를 받아 배치만 한다.
export function useCommentsSheetDrag({
  height,
  isOpen,
  onClose,
  postId,
}: UseCommentsSheetDragParams) {
  const isClosingRef = useRef(false);
  const sheetTranslateY = useRef(new Animated.Value(0)).current;

  const closeWithAnimation = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    Animated.timing(sheetTranslateY, {
      duration: 180,
      toValue: height,
      useNativeDriver: true,
    }).start(() => {
      isClosingRef.current = false;
      onClose();
    });
  }, [height, onClose, sheetTranslateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          gestureState.dy > 8 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onMoveShouldSetPanResponderCapture: (_event, gestureState) =>
          gestureState.dy > 2 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderGrant: () => {
          sheetTranslateY.stopAnimation();
          sheetTranslateY.setValue(0);
        },
        onPanResponderMove: (_event, gestureState) => {
          sheetTranslateY.setValue(Math.max(0, gestureState.dy));
        },
        onPanResponderRelease: (_event, gestureState) => {
          if (gestureState.dy > 56 || gestureState.vy > 0.75) {
            closeWithAnimation();
            return;
          }
          Animated.spring(sheetTranslateY, {
            damping: 22,
            mass: 0.7,
            stiffness: 240,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(sheetTranslateY, {
            damping: 22,
            mass: 0.7,
            stiffness: 240,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [closeWithAnimation, sheetTranslateY],
  );

  useEffect(() => {
    if (!isOpen || !postId) {
      return;
    }

    sheetTranslateY.setValue(0);
    isClosingRef.current = false;
  }, [isOpen, postId, sheetTranslateY]);

  return {
    closeWithAnimation,
    panHandlers: panResponder.panHandlers,
    sheetTranslateY,
  };
}
