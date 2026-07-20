import { useEffect } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type SkeletonBlockProps = {
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

// 로딩 중 실제 콘텐츠 자리를 먼저 잡아두는 기본 블록. 화면별 스켈레톤은 이 블록을 조합한다.
export function SkeletonBlock({ radius = 10, style }: SkeletonBlockProps) {
  const opacity = useSharedValue(0.48);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, {
        duration: 900,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.block, { borderRadius: radius }, style, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: "#E4E4E7",
  },
});
