import { Image } from "expo-image";
import { Play } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import type { PostInsight } from "../../features/metrics/api";
import {
  fontSize,
  fontWeight,
  useTheme,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

function formatCreatedAt(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  });
}

export function PostInsightPreview({ insight }: { insight: PostInsight }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.container}>
      <View style={styles.thumbnail}>
        {insight.thumbnailUrl ? (
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            source={{ uri: insight.thumbnailUrl }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {insight.isVideo ? (
          <View style={styles.playBadge}>
            <Play color={colors.white} fill={colors.white} size={16} />
          </View>
        ) : null}
      </View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>게시물 인사이트</Text>
        <Text style={styles.date}>{formatCreatedAt(insight.createdAt)}</Text>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 18,
    backgroundColor: c.navBackground,
    padding: 14,
  },
  thumbnail: {
    width: 104,
    height: 104,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: c.imagePlaceholder,
  },
  playBadge: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: c.scrimStrong,
  },
  copy: {
    minWidth: 0,
    flex: 1,
    gap: 6,
  },
  eyebrow: {
    color: c.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
  },
  date: {
    color: c.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
  },
});
