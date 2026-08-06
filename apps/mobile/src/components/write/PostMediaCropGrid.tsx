import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

import { useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type PostMediaCropGridProps = {
  opacity: SharedValue<number>;
};

export function PostMediaCropGrid({ opacity }: PostMediaCropGridProps) {
  const styles = useThemedStyles(makeStyles);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, animatedStyle]}
    >
      <View style={[styles.verticalLine, styles.firstVerticalLine]} />
      <View style={[styles.verticalLine, styles.secondVerticalLine]} />
      <View style={[styles.horizontalLine, styles.firstHorizontalLine]} />
      <View style={[styles.horizontalLine, styles.secondHorizontalLine]} />
    </Animated.View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  verticalLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: c.onMediaBorderFaint,
  },
  firstVerticalLine: {
    left: "33.3333%",
  },
  secondVerticalLine: {
    left: "66.6667%",
  },
  horizontalLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.onMediaBorderFaint,
  },
  firstHorizontalLine: {
    top: "33.3333%",
  },
  secondHorizontalLine: {
    top: "66.6667%",
  },
});
