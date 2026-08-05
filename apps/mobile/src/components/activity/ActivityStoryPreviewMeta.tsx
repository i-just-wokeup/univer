import { Eye, Heart } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ActivityStory } from "../../features/activity/api";
import { colors, fontSize, fontWeight } from "../../lib/theme";
import { activityStoryDisplay } from "./ActivityStoryGrid";

type ActivityStoryPreviewMetaProps = {
  likedCount: number;
  onOpenViewers: () => void;
  story: ActivityStory;
};

export function ActivityStoryPreviewMeta({
  likedCount,
  onOpenViewers,
  story,
}: ActivityStoryPreviewMetaProps) {
  return (
    <View style={styles.meta}>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenViewers}
        style={({ pressed }) => [
          styles.metaButton,
          pressed ? styles.metaButtonPressed : null,
        ]}
      >
        <Eye color={colors.white} size={15} strokeWidth={2.4} />
        <Text style={styles.metaText}>조회 {story.views_count}</Text>
      </Pressable>
      <View style={styles.metaItem}>
        <Heart color={colors.white} size={15} strokeWidth={2.4} />
        <Text style={styles.metaText}>좋아요 {likedCount}</Text>
      </View>
      <Text style={styles.metaText}>
        {activityStoryDisplay.getVisibilityLabel(story.visibility)}
      </Text>
      <Text style={styles.metaText}>
        {activityStoryDisplay.getStoryStatus(story)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.onMediaFillFaint,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: colors.onMediaFillFaint,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaButtonPressed: {
    opacity: 0.7,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: colors.onMediaText,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
  },
});
