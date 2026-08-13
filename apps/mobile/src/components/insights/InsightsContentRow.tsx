import { Image } from "expo-image";
import { Play } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ContentPerformance } from "../../features/metrics/api";
import { fontSize, fontWeight, useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

function totalEngagement(item: ContentPerformance): number {
  return item.likes + item.comments + item.saves + item.shares;
}

export function InsightsContentRow({
  item,
  onPress,
}: {
  item: ContentPerformance;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      accessibilityLabel="게시물 성과 상세 보기"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <View style={styles.thumbnail}>
        {item.thumbnailUrl ? (
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            recyclingKey={item.postId}
            source={{ uri: item.thumbnailUrl }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={styles.placeholder} />
        )}
        {item.isVideo ? (
          <View style={styles.videoBadge}>
            <Play color={colors.white} fill={colors.white} size={12} />
          </View>
        ) : null}
      </View>

      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text style={styles.total}>
            총반응 {totalEngagement(item).toLocaleString("ko-KR")}
          </Text>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString("ko-KR", {
              month: "numeric",
              day: "numeric",
              timeZone: "Asia/Seoul",
            })}
          </Text>
        </View>
        <Text numberOfLines={1} style={styles.breakdown}>
          좋아요 {item.likes} · 댓글 {item.comments} · 저장 {item.saves} · 공유 {item.shares}
        </Text>
      </View>
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.68,
  },
  thumbnail: {
    width: 64,
    height: 64,
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: c.imagePlaceholder,
  },
  placeholder: {
    flex: 1,
    backgroundColor: c.imagePlaceholder,
  },
  videoBadge: {
    position: "absolute",
    right: 5,
    top: 5,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: c.scrimStrong,
  },
  details: {
    minWidth: 0,
    flex: 1,
    gap: 7,
  },
  titleRow: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  total: {
    minWidth: 0,
    flexShrink: 1,
    color: c.text,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.heavy,
  },
  date: {
    flexShrink: 0,
    color: c.textFaint,
    fontSize: fontSize.footnote,
    fontWeight: fontWeight.semibold,
  },
  breakdown: {
    color: c.muted,
    fontSize: fontSize.footnote,
    fontWeight: fontWeight.medium,
  },
});
