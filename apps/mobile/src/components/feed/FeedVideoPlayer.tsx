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
  thumbnailUrl: string | null;
  uri: string;
};

// 피드 영상 재생기 (릴스식). 활성 카드면 음소거 자동재생(loop), 화면 밖이면 멈춤.
// 탭하면 음소거 ↔ 소리. 비활성 동안은 썸네일 포스터를 덮어 깜빡임을 줄인다.
export function FeedVideoPlayer({
  aspectRatio,
  isActive,
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
    <Pressable
      accessibilityLabel={isMuted ? "소리 켜기" : "음소거"}
      onPress={toggleMute}
      style={[styles.frame, frameStyle]}
    >
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

      {/* 음소거 표시(항상). 탭하면 토글 */}
      <View style={styles.muteBadge}>
        {isMuted ? (
          <VolumeX color={colors.white} size={16} strokeWidth={2.4} />
        ) : (
          <Volume2 color={colors.white} size={16} strokeWidth={2.4} />
        )}
      </View>
    </Pressable>
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
