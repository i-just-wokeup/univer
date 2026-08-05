import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import type { ActivityStory } from "../../features/activity/api";
import { colors, fontSize, fontWeight } from "../../lib/theme";
import { StoryVideoView } from "../stories/StoryVideoView";
import { formatActivityStoryDateTime } from "./activityDateFormat";

type ActivityStoryPreviewMediaProps = {
  story: ActivityStory;
};

export function ActivityStoryPreviewMedia({
  story,
}: ActivityStoryPreviewMediaProps) {
  const isVideo = story.type === "video";
  const isVideoReady = isVideo && story.processing_status === "ready";

  return (
    <View style={styles.preview}>
      {isVideoReady ? (
        <StoryVideoView loop style={styles.previewMedia} uri={story.image_url} />
      ) : isVideo ? (
        <>
          <Image
            cachePolicy="memory-disk"
            contentFit="contain"
            source={{ uri: story.thumbnail_url ?? story.image_url }}
            style={styles.previewImage}
          />
          <View style={styles.processingOverlay}>
            <Text style={styles.processingText}>
              {story.processing_status === "failed"
                ? "영상 처리 실패"
                : "영상 처리 중"}
            </Text>
          </View>
        </>
      ) : (
        <Image
          cachePolicy="memory-disk"
          contentFit="contain"
          source={{ uri: story.image_url }}
          style={styles.previewImage}
        />
      )}
      <View style={styles.dateBadge}>
        <Text style={styles.dateText}>
          {formatActivityStoryDateTime(story.created_at)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    width: "100%",
    aspectRatio: 9 / 16,
    backgroundColor: colors.black,
  },
  previewImage: {
    height: "100%",
    width: "100%",
  },
  previewMedia: {
    height: "100%",
    width: "100%",
    borderRadius: 0,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.scrimWeak,
  },
  processingText: {
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: colors.scrimStrong,
    color: colors.white,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  dateBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    borderRadius: 12,
    backgroundColor: colors.scrimStrong,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  dateText: {
    color: colors.white,
    fontSize: fontSize.label,
    fontWeight: fontWeight.heavy,
  },
});
