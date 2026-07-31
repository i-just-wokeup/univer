import { Heart } from "lucide-react-native";
import { useEffect, useRef, type ReactNode } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "../../lib/theme";

// 이 시간 안에 두 번 탭하면 더블탭(좋아요)으로 본다. 단일 탭은 이 시간만큼 기다렸다 확정.
const DOUBLE_TAP_MS = 220;

type DoubleTapLikeProps = {
  children?: ReactNode;
  // 더블탭 시 호출 — "이미 좋아요면 무시" 같은 판단은 호출부가 한다(인스타식: 더블탭은 좋아요만).
  onDoubleTap: () => void;
  // 단일 탭 확정 시 호출(더블탭이 아닌 게 확인된 뒤). 없으면 단일 탭은 무시.
  onSingleTap?: () => void;
  style?: StyleProp<ViewStyle>;
};

// 탭 영역을 감싸 더블탭=좋아요(중앙 하트 팝) / 단일탭=onSingleTap을 구분한다.
// gesture-handler 없이 RN 내장 Animated + 탭 간격 측정으로 구현(피드·릴스 공용).
export function DoubleTapLike({
  children,
  onDoubleTap,
  onSingleTap,
  style,
}: DoubleTapLikeProps) {
  const lastTapRef = useRef(0);
  const singleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (singleTimerRef.current) {
        clearTimeout(singleTimerRef.current);
      }
    };
  }, []);

  function popHeart() {
    scale.setValue(0.4);
    opacity.setValue(1);
    Animated.parallel([
      Animated.spring(scale, {
        friction: 4,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(450),
        Animated.timing(opacity, {
          duration: 250,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }

  function handlePress() {
    const now = Date.now();

    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      // 더블탭 — 대기 중이던 단일 탭은 취소하고 좋아요 처리.
      if (singleTimerRef.current) {
        clearTimeout(singleTimerRef.current);
        singleTimerRef.current = null;
      }
      lastTapRef.current = 0;
      popHeart();
      onDoubleTap();
      return;
    }

    lastTapRef.current = now;

    // 두 번째 탭을 기다렸다가 안 오면 단일 탭 확정(그래서 일시정지 등이 살짝 늦게 걸린다).
    if (onSingleTap) {
      singleTimerRef.current = setTimeout(() => {
        singleTimerRef.current = null;
        onSingleTap();
      }, DOUBLE_TAP_MS);
    }
  }

  return (
    <Pressable onPress={handlePress} style={style}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[styles.heart, { opacity, transform: [{ scale }] }]}
      >
        <Heart color={colors.white} fill={colors.white} size={96} strokeWidth={0} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heart: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
