import { Image } from "expo-image";
import { useVideoPlayer, VideoView, type VideoContentFit } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { DEFAULT_STORY_BACKGROUND_COLOR } from "../../features/stories/backgroundColors";

type StoryVideoViewProps = {
  backgroundColor?: string | null;
  contentFit?: VideoContentFit;
  // 0~100. 영상 재생 위치를 진행바에 반영하고 싶을 때.
  onProgress?: (percent: number) => void;
  // 영상이 끝까지 재생됐을 때(뷰어가 다음 스토리로 넘어가게).
  onEnd?: () => void;
  // 화면에 실제로 보여질 때만 VideoView를 네이티브 뷰에 연결한다.
  // expo-video player release 경합을 줄이기 위한 안전장치다.
  isActive?: boolean;
  // 지금 보여지는 스토리인지. preload로 재사용되는 플레이어라도 현재가 될 때마다
  // 처음(0초)부터 재생한다(스토리는 항상 처음부터). 재생은 현재일 때만.
  isCurrent?: boolean;
  isPaused?: boolean;
  // 미리보기는 반복 재생(true). 뷰어는 false여야 끝에서 onEnd로 다음 스토리로 넘어간다.
  loop?: boolean;
  posterUrl?: string | null;
  style?: ViewStyle;
  uri: string;
};

// 스토리 영상 재생기 — 9:16 프레임 안에서 영상을 재생하고, 진행/종료를 콜백으로 알린다.
// 작성 미리보기와 뷰어가 같은 모양이 되도록 공용으로 쓴다.
export function StoryVideoView({
  backgroundColor = DEFAULT_STORY_BACKGROUND_COLOR,
  contentFit = "contain",
  isActive = true,
  isCurrent = true,
  isPaused = false,
  loop = false,
  onEnd,
  onProgress,
  posterUrl = null,
  style,
  uri,
}: StoryVideoViewProps) {
  // 콜백을 ref로 들고 있어 리스너를 매 렌더 재구독하지 않게 한다.
  const onProgressRef = useRef(onProgress);
  const onEndRef = useRef(onEnd);
  const [hasSource, setHasSource] = useState(false);
  const [hasRenderedFirstFrame, setHasRenderedFirstFrame] = useState(false);
  onProgressRef.current = onProgress;
  onEndRef.current = onEnd;

  const player = useVideoPlayer(null, (instance) => {
    instance.loop = loop;
    instance.muted = false;
    instance.timeUpdateEventInterval = 0.1;
    // 뷰어(Cloudflare HLS 스트리밍)와 작성 미리보기(무압축 로컬 원본)의 버퍼 전략을 나눈다.
    if (/^https?:/i.test(uri)) {
      // HLS: 8MB 캡이 초기 로딩/재생을 느리게 해 제거하고, 시작 대기를 줄인다.
      // (Cloudflare가 서빙하므로 Supabase egress와 무관, 스토리는 1개씩만 재생돼 OOM 위험 없음)
      instance.bufferOptions = {
        preferredForwardBufferDuration: 8,
        minBufferForPlayback: 0.5,
      };
    } else {
      // 로컬 원본(파일): 통째로 버퍼링하면 OOM → 8MB로 제한(안드로이드).
      instance.bufferOptions = {
        maxBufferBytes: 8 * 1024 * 1024,
        preferredForwardBufferDuration: 5,
        minBufferForPlayback: 1,
      };
    }
  });

  useEffect(() => {
    let isCancelled = false;

    async function replaceSource() {
      setHasSource(false);
      setHasRenderedFirstFrame(false);

      try {
        await player.pause();
        await player.replaceAsync(isActive ? uri : null);

        if (isCancelled) {
          return;
        }

        setHasSource(isActive);
      } catch {
        if (!isCancelled) {
          setHasSource(false);
        }
      }
    }

    void replaceSource();

    return () => {
      isCancelled = true;
    };
  }, [isActive, player, uri]);

  useEffect(
    () => () => {
      try {
        player.pause();
        void player.replaceAsync(null).catch(() => undefined);
      } catch {
        // native player가 먼저 release된 상태면 정리 실패는 무시한다.
      }
    },
    [player],
  );

  useEffect(() => {
    const timeSubscription = player.addListener(
      "timeUpdate",
      ({ currentTime }) => {
        let total = 0;

        try {
          total = player.duration;
        } catch {
          return;
        }

        if (total > 0) {
          onProgressRef.current?.(Math.min(100, (currentTime / total) * 100));
        }
      },
    );
    const endSubscription = player.addListener("playToEnd", () => {
      // expo-video는 소스를 새로 물릴 때(null→uri) 가짜 playToEnd를 한 번 쏜다.
      // 재생 위치가 실제로 영상 끝 근처일 때만 다음으로 넘기고, 초반에 튀는 가짜는 무시한다.
      try {
        const total = player.duration;
        if (total > 0 && player.currentTime >= total - 0.75) {
          onEndRef.current?.();
        }
      } catch {
        // 전환 중 native player가 먼저 release된 경우 무시한다.
      }
    });

    return () => {
      try {
        timeSubscription.remove();
        endSubscription.remove();
      } catch {
        // 화면 전환 중 네이티브 player가 먼저 release된 경우가 있어 정리 실패는 무시한다.
      }
    };
  }, [player]);

  // 현재 스토리가 될 때마다 재생 위치를 처음으로 되돌린다(preload 재사용 플레이어라도 항상 0초부터).
  useEffect(() => {
    if (!isCurrent) {
      return;
    }

    try {
      player.currentTime = 0;
    } catch {
      // 전환 중 native player가 먼저 release된 경우 무시한다.
    }
  }, [isCurrent, player]);

  useEffect(() => {
    try {
      if (!isActive || !hasSource || !isCurrent || isPaused) {
        player.pause();
      } else {
        player.play();
      }
    } catch {
      // 빠른 화면 전환/제출 중 release된 player에 play/pause가 들어가면 무시한다.
    }
  }, [hasSource, isActive, isCurrent, isPaused, player]);

  return (
    <View
      style={[
        styles.frame,
        { backgroundColor: backgroundColor ?? DEFAULT_STORY_BACKGROUND_COLOR },
        style,
      ]}
    >
      {isActive && hasSource ? (
        <VideoView
          contentFit={contentFit}
          nativeControls={false}
          onFirstFrameRender={() => setHasRenderedFirstFrame(true)}
          player={player}
          surfaceType="textureView"
          style={styles.fill}
          useExoShutter
        />
      ) : null}
      {posterUrl && !hasRenderedFirstFrame ? (
        <Image
          cachePolicy="memory-disk"
          contentFit={contentFit}
          source={{ uri: posterUrl }}
          style={styles.fill}
        />
      ) : null}
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
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
});
