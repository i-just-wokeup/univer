import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Play, Volume2, VolumeX } from "lucide-react-native";
import { useState } from "react";
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
  thumbnailUrl: string | null;
  uri: string;
};

// 피드 영상 1개 재생기. 처음엔 썸네일 포스터 + 재생(▶) 버튼, 탭하면 재생/일시정지.
// 음소거 토글 제공. (보이는 1개만 자동재생은 4단계에서 추가)
export function FeedVideoPlayer({
  aspectRatio,
  thumbnailUrl,
  uri,
}: FeedVideoPlayerProps) {
  const { width } = useWindowDimensions();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.muted = false;
  });

  function togglePlay() {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  }

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
    <Pressable onPress={togglePlay} style={[styles.frame, frameStyle]}>
      <VideoView
        contentFit="cover"
        nativeControls={false}
        player={player}
        style={StyleSheet.absoluteFill}
      />

      {/* 재생 전: 썸네일 포스터 + 재생 버튼 */}
      {!isPlaying ? (
        <View style={StyleSheet.absoluteFill}>
          {thumbnailUrl ? (
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              source={{ uri: thumbnailUrl }}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Play color={colors.white} fill={colors.white} size={26} />
            </View>
          </View>
        </View>
      ) : null}

      {/* 음소거 토글 (재생 중에만) */}
      {isPlaying ? (
        <Pressable
          accessibilityLabel={isMuted ? "소리 켜기" : "음소거"}
          accessibilityRole="button"
          hitSlop={8}
          onPress={toggleMute}
          style={styles.muteButton}
        >
          {isMuted ? (
            <VolumeX color={colors.white} size={18} strokeWidth={2.4} />
          ) : (
            <Volume2 color={colors.white} size={18} strokeWidth={2.4} />
          )}
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    backgroundColor: colors.imagePlaceholder,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    height: 64,
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  muteButton: {
    position: "absolute",
    right: 14,
    bottom: 14,
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
});
