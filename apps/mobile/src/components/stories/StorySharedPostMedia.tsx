import { Image } from "expo-image";
import { Play } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import type { StorySharedPost } from "../../features/stories/types";
import { colors } from "../../lib/theme";
import { getAspectRatioValue } from "../../lib/utils/aspectRatio";
import { StoryVideoView } from "./StoryVideoView";

type StorySharedPostMediaProps = {
  isActive: boolean;
  isPaused: boolean;
  post: StorySharedPost;
};

export function StorySharedPostMedia({
  isActive,
  isPaused,
  post,
}: StorySharedPostMediaProps) {
  const sourceRatio = getAspectRatioValue(post.aspectRatio);
  const boxRatio = Math.min(sourceRatio, 1);
  const contentFit = sourceRatio > 1 ? "contain" : "cover";
  const media = post.media;

  return (
    <View pointerEvents="none" style={[styles.frame, { aspectRatio: boxRatio }]}>
      {media?.type === "video" ? (
        <StoryVideoView
          backgroundColor={colors.black}
          contentFit={contentFit}
          fillFrame
          isActive={isActive}
          isCurrent={isActive}
          isPaused={isPaused}
          loop
          muted
          posterUrl={media.thumbnailUrl}
          style={styles.video}
          uri={media.url}
        />
      ) : media ? (
        <Image
          cachePolicy="memory-disk"
          contentFit={contentFit}
          recyclingKey={`${post.id}:${media.url}`}
          source={{ uri: media.url }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {media?.type === "video" && !isActive ? (
        <View pointerEvents="none" style={styles.playBadge}>
          <Play
            color={colors.white}
            fill={colors.white}
            size={22}
            strokeWidth={2}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
    backgroundColor: colors.black,
  },
  video: {
    borderRadius: 0,
  },
  playBadge: {
    position: "absolute",
    height: 48,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: colors.scrimStrong,
  },
});
