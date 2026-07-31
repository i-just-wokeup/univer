import { useEvent } from "expo";
import type { VideoPlayer } from "expo-video";
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors } from "../../lib/theme";

type ReelProgressBarProps = {
  player: VideoPlayer;
  bottomInset: number;
};

// 하단 진행바(표시 전용). 재생위치(currentTime)는 0.25초마다 오지만 reanimated로
// 그 사이를 부드럽게 보간해 매끄럽게 채운다. 탭은 안 막는다(pointerEvents none).
export function ReelProgressBar({ player, bottomInset }: ReelProgressBarProps) {
  // useEvent는 첫 이벤트 전엔 null → 그동안은 0으로 본다.
  const payload = useEvent(player, "timeUpdate");
  const currentTime = payload?.currentTime ?? 0;
  const progress = useSharedValue(0);
  const lastRef = useRef(0);

  useEffect(() => {
    const duration = player.duration;
    const target =
      duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
    // loop로 0초로 되돌아가면(target이 확 작아짐) 되감기 애니메이션 없이 즉시 리셋.
    if (target < lastRef.current) {
      progress.value = target;
    } else {
      progress.value = withTiming(target, {
        duration: 260,
        easing: Easing.linear,
      });
    }
    lastRef.current = target;
  }, [currentTime, player, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  return (
    <View pointerEvents="none" style={[styles.track, { bottom: bottomInset }]}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: colors.onMediaFill,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.onMediaFillStrong,
    transformOrigin: "left",
  },
});
