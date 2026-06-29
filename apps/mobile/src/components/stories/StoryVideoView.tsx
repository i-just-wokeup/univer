import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { colors } from "../../lib/theme";

type StoryVideoViewProps = {
  // 0~100. 영상 재생 위치를 진행바에 반영하고 싶을 때.
  onProgress?: (percent: number) => void;
  // 영상이 끝까지 재생됐을 때(뷰어가 다음 스토리로 넘어가게).
  onEnd?: () => void;
  isPaused?: boolean;
  // 미리보기는 반복 재생(true). 뷰어는 false여야 끝에서 onEnd로 다음 스토리로 넘어간다.
  loop?: boolean;
  style?: ViewStyle;
  uri: string;
};

// 스토리 영상 재생기 — 9:16 프레임 안에서 영상을 재생하고, 진행/종료를 콜백으로 알린다.
// 작성 미리보기와 뷰어가 같은 모양이 되도록 공용으로 쓴다.
export function StoryVideoView({
  isPaused = false,
  loop = false,
  onEnd,
  onProgress,
  style,
  uri,
}: StoryVideoViewProps) {
  // 콜백을 ref로 들고 있어 리스너를 매 렌더 재구독하지 않게 한다.
  const onProgressRef = useRef(onProgress);
  const onEndRef = useRef(onEnd);
  onProgressRef.current = onProgress;
  onEndRef.current = onEnd;

  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = loop;
    instance.muted = false;
    instance.timeUpdateEventInterval = 0.1;
    instance.play();
  });

  useEffect(() => {
    const timeSubscription = player.addListener(
      "timeUpdate",
      ({ currentTime }) => {
        const total = player.duration;

        if (total > 0) {
          onProgressRef.current?.(Math.min(100, (currentTime / total) * 100));
        }
      },
    );
    const endSubscription = player.addListener("playToEnd", () => {
      onEndRef.current?.();
    });

    return () => {
      timeSubscription.remove();
      endSubscription.remove();
    };
  }, [player]);

  useEffect(() => {
    if (isPaused) {
      player.pause();
    } else {
      player.play();
    }
  }, [isPaused, player]);

  return (
    <View style={[styles.frame, style]}>
      <VideoView
        contentFit="cover"
        nativeControls={false}
        player={player}
        style={styles.fill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    aspectRatio: 9 / 16,
    maxHeight: "100%",
    overflow: "hidden",
    borderRadius: 6,
    backgroundColor: colors.black,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
});
