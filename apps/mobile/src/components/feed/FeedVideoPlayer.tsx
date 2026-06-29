import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Volume2, VolumeX } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { colors } from "../../lib/theme";
import { getAspectRatioValue } from "../../lib/utils/aspectRatio";
import type { PostAspectRatio } from "../../features/feed/types";

type FeedVideoPlayerProps = {
  aspectRatio: PostAspectRatio;
  // 피드에서 지금 보이는(활성) 카드면 자동재생, 아니면 일시정지(썸네일).
  isActive: boolean;
  // 영상 영역(음소거 아이콘 제외)을 누르면 호출 — 릴스 상세로 이동용.
  onPress?: () => void;
  thumbnailUrl: string | null;
  uri: string;
};

// 피드 영상 재생기. 활성 카드면 음소거 자동재생(loop), 화면 밖이면 멈춤.
// 영상 영역 탭=onPress(릴스 이동), 음소거 아이콘 탭=음소거 토글. 비활성은 썸네일로 덮는다.
export function FeedVideoPlayer({
  aspectRatio,
  isActive,
  onPress,
  thumbnailUrl,
  uri,
}: FeedVideoPlayerProps) {
  const { width } = useWindowDimensions();
  const [isMuted, setIsMuted] = useState(true);

  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  // 활성 카드만 재생. 스크롤로 화면 밖이면 멈춰서 1개만 재생되게 한다.
  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

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
      <VideoView
        contentFit="cover"
        nativeControls={false}
        player={player}
        style={StyleSheet.absoluteFill}
      />

      {/* 비활성(정지) 카드는 썸네일을 덮어 검은 화면/깜빡임 방지 */}
      {!isActive && thumbnailUrl ? (
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          source={{ uri: thumbnailUrl }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {/* 영상 위 투명 오버레이 — 네이티브 VideoView가 터치를 먹으므로 여기서 영역 탭을 받는다(릴스 이동) */}
      <Pressable
        accessibilityLabel="영상 크게 보기"
        onPress={onPress}
        style={StyleSheet.absoluteFill}
      />

      {/* 음소거 버튼 — 오버레이 위에 얹혀 이 아이콘만 음소거 토글 */}
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
});
