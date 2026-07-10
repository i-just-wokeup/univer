import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Volume2, VolumeX } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { DoubleTapLike } from "../common/DoubleTapLike";
import { colors } from "../../lib/theme";
import { getAspectRatioValue } from "../../lib/utils/aspectRatio";
import type { PostAspectRatio } from "../../features/feed/types";

type FeedVideoPlayerProps = {
  aspectRatio: PostAspectRatio;
  // 피드에서 지금 보이는(활성) 카드면 자동재생, 아니면 일시정지(썸네일).
  isActive: boolean;
  // 영상 더블탭 시 좋아요(있으면 영역 오버레이가 더블탭을 처리).
  onDoubleLike?: () => void;
  // 영상 영역(음소거 아이콘 제외)을 누르면 호출 — 릴스 상세로 이동용.
  onPress?: () => void;
  processingStatus?: "processing" | "ready" | "failed";
  thumbnailUrl: string | null;
  uri: string;
};

// 피드 영상 재생기. 활성 카드면 음소거 자동재생(loop), 화면 밖이면 멈춤.
// 영상 영역 탭=onPress(릴스 이동), 음소거 아이콘 탭=음소거 토글. 비활성은 썸네일로 덮는다.
export function FeedVideoPlayer({
  aspectRatio,
  isActive,
  onDoubleLike,
  onPress,
  processingStatus = "ready",
  thumbnailUrl,
  uri,
}: FeedVideoPlayerProps) {
  const { width } = useWindowDimensions();
  const [isMuted, setIsMuted] = useState(true);
  const isReady = processingStatus === "ready";
  const shouldRenderVideo = isActive && isReady;

  const player = useVideoPlayer(isReady ? { uri, useCaching: true } : null, (instance) => {
    instance.loop = true;
    instance.muted = true;
    // OOM 방지: 무압축 원본 영상을 통째로 버퍼링하지 않게 제한(안드로이드).
    instance.bufferOptions = {
      maxBufferBytes: 8 * 1024 * 1024,
      preferredForwardBufferDuration: 5,
      minBufferForPlayback: 1,
    };
  });

  // 활성 카드만 재생. 스크롤로 화면 밖이면 멈춰서 1개만 재생되게 한다.
  useEffect(() => {
    if (isActive && isReady) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, isReady, player]);

  function toggleMute() {
    const next = !isMuted;
    player.muted = next;
    setIsMuted(next);
  }

  const frameStyle = {
    aspectRatio: getAspectRatioValue(aspectRatio),
    width,
  };

  return (
    <View style={[styles.frame, frameStyle]}>
      {shouldRenderVideo ? (
        <VideoView
          contentFit="cover"
          key={uri}
          nativeControls={false}
          player={player}
          surfaceType="textureView"
          style={StyleSheet.absoluteFill}
          useExoShutter
        />
      ) : null}

      {/* 비활성(정지) 카드는 썸네일을 덮어 검은 화면/깜빡임 방지 */}
      {!shouldRenderVideo && thumbnailUrl ? (
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          source={{ uri: thumbnailUrl }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {!isReady ? (
        <View style={styles.processingOverlay}>
          <Text style={styles.processingText}>
            {processingStatus === "failed" ? "영상 업로드 실패" : "영상 업로드 중"}
          </Text>
        </View>
      ) : null}

      {/* 영상 위 오버레이 — 단일 탭=릴스 이동, 더블탭=좋아요(핸들러 있을 때). 네이티브 VideoView가 터치를 먹으므로 여기서 받는다 */}
      {onDoubleLike ? (
        <DoubleTapLike
          onDoubleTap={onDoubleLike}
          onSingleTap={onPress}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <Pressable
          accessibilityLabel="영상 크게 보기"
          onPress={onPress}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* 음소거 버튼 — 오버레이 위에 얹혀 이 아이콘만 음소거 토글 */}
      {isReady ? (
        <Pressable
          accessibilityLabel={isMuted ? "소리 켜기" : "음소거"}
          accessibilityRole="button"
          hitSlop={8}
          onPress={toggleMute}
          style={styles.muteBadge}
        >
          {isMuted ? (
            <VolumeX color={colors.white} size={16} strokeWidth={2.4} />
          ) : (
            <Volume2 color={colors.white} size={16} strokeWidth={2.4} />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    backgroundColor: colors.imagePlaceholder,
  },
  muteBadge: {
    position: "absolute",
    right: 14,
    bottom: 14,
    height: 32,
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  processingText: {
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.58)",
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
