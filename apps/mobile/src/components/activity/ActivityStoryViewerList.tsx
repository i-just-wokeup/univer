import { ChevronDown } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type {
  ActivityStory,
  ActivityStoryViewer,
} from "../../features/activity/api";
import { colors, fontSize, fontWeight } from "../../lib/theme";
import { formatActivityStoryDateTime } from "./activityDateFormat";
import { ActivityStoryViewerRow } from "./ActivityStoryViewerRow";

type ActivityStoryViewerListProps = {
  isLoadingViewers: boolean;
  onClose: () => void;
  story: ActivityStory;
  viewers: ActivityStoryViewer[];
};

export function ActivityStoryViewerList({
  isLoadingViewers,
  onClose,
  story,
  viewers,
}: ActivityStoryViewerListProps) {
  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        style={styles.viewerHeader}
      >
        <View>
          <Text style={styles.viewerTitle}>조회한 사람</Text>
          <Text style={styles.viewerTime}>
            {formatActivityStoryDateTime(story.created_at)}
          </Text>
        </View>
        <ChevronDown color={colors.white} size={22} strokeWidth={2.6} />
      </Pressable>
      <ScrollView style={styles.viewerList}>
        {isLoadingViewers ? (
          <Text style={styles.viewerEmpty}>조회자 정보를 불러오는 중입니다.</Text>
        ) : viewers.length > 0 ? (
          viewers.map((viewer) => (
            <ActivityStoryViewerRow key={viewer.id} viewer={viewer} />
          ))
        ) : (
          <Text style={styles.viewerEmpty}>아직 조회한 사람이 없습니다.</Text>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  viewerTitle: {
    color: colors.white,
    fontSize: fontSize.body,
    fontWeight: fontWeight.heavy,
  },
  viewerTime: {
    marginTop: 2,
    color: colors.onMediaTextFaint,
    fontSize: fontSize.label,
    fontWeight: fontWeight.semibold,
  },
  viewerList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  viewerEmpty: {
    paddingVertical: 24,
    color: colors.onMediaTextFaint,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
    textAlign: "center",
  },
});
