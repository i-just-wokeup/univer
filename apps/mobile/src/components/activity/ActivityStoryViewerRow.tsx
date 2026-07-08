import { Heart } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import type { ActivityStoryViewer } from "../../features/activity/api";
import { colors } from "../../lib/theme";
import { Avatar } from "../common/Avatar";
import { formatActivityViewerTime } from "./activityDateFormat";

type ActivityStoryViewerRowProps = {
  viewer: ActivityStoryViewer;
};

export function ActivityStoryViewerRow({
  viewer,
}: ActivityStoryViewerRowProps) {
  return (
    <View style={styles.viewerRow}>
      <Avatar imageUrl={viewer.avatar_url} label={viewer.nickname} size={38} />
      <View style={styles.viewerBody}>
        <Text numberOfLines={1} style={styles.viewerName}>
          {viewer.nickname}
        </Text>
        <Text style={styles.viewerSub}>
          {formatActivityViewerTime(viewer.viewed_at)}
        </Text>
      </View>
      {viewer.isLiked ? (
        <View style={styles.likeBadge}>
          <Heart color={colors.danger} fill={colors.danger} size={13} />
          <Text style={styles.likeText}>좋아요</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  viewerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  viewerBody: {
    minWidth: 0,
    flex: 1,
  },
  viewerName: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  viewerSub: {
    marginTop: 2,
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "700",
  },
  likeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,59,78,0.14)",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  likeText: {
    color: "#FECACA",
    fontSize: 11,
    fontWeight: "900",
  },
});
