import { Film, Volume2, VolumeX } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { PostLibraryVideo } from "../../features/feed/postMediaLibrary";
import type { PostAspectRatio } from "../../features/feed/types";
import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { getAspectRatioValue } from "../../lib/utils/aspectRatio";
import { StoryVideoView } from "../stories/StoryVideoView";

type PostVideoPickerPreviewProps = {
  aspectRatio: PostAspectRatio;
  playbackUri: string | null;
  video: PostLibraryVideo | null;
};

export function PostVideoPickerPreview({
  aspectRatio,
  playbackUri,
  video,
}: PostVideoPickerPreviewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [unmutedVideoId, setUnmutedVideoId] = useState<string | null>(null);
  const isMuted = unmutedVideoId !== video?.id;

  return (
    <View
      style={[styles.frame, { aspectRatio: getAspectRatioValue(aspectRatio) }]}
    >
      {video && playbackUri ? (
        <StoryVideoView
          backgroundColor={colors.black}
          contentFit="contain"
          key={video.id}
          loop
          muted={isMuted}
          style={styles.video}
          uri={playbackUri}
        />
      ) : (
        <View style={styles.empty}>
          <Film color={colors.textFaint} size={36} strokeWidth={1.8} />
        </View>
      )}

      {video && playbackUri ? (
        <Pressable
          accessibilityLabel={isMuted ? "영상 소리 켜기" : "영상 소리 끄기"}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() =>
            setUnmutedVideoId((currentId) =>
              currentId === video.id ? null : video.id,
            )
          }
          style={({ pressed }) => [
            styles.soundButton,
            pressed ? styles.pressed : null,
          ]}
        >
          {isMuted ? (
            <VolumeX color={colors.onMediaGlyph} size={20} strokeWidth={2.3} />
          ) : (
            <Volume2 color={colors.onMediaGlyph} size={20} strokeWidth={2.3} />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  frame: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    backgroundColor: c.black,
  },
  video: {
    height: "100%",
    width: "100%",
    aspectRatio: undefined,
    borderRadius: 0,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.imagePlaceholder,
  },
  soundButton: {
    position: "absolute",
    left: 12,
    bottom: 12,
    height: 38,
    width: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: c.mediaControlBg,
  },
  pressed: {
    opacity: 0.72,
  },
});
