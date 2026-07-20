import { Image } from "expo-image";
import { Play } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ActivityStory } from "../../features/activity/api";
import { colors } from "../../lib/theme";
import { StateView } from "../common/StateView";

type ActivityStoryGridProps = {
  onSelectStory: (story: ActivityStory) => void;
  stories: ActivityStory[];
};

function chunkIntoRows<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }

  return rows;
}

function formatStoryArchiveDate(createdAt: string) {
  const date = new Date(createdAt);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function getStoryStatus(story: ActivityStory) {
  return new Date(story.expires_at).getTime() > Date.now() ? "활성" : "만료됨";
}

function getVisibilityLabel(visibility: ActivityStory["visibility"]) {
  return visibility === "close_friends" ? "크루공개" : "전체공개";
}

export function ActivityStoryGrid({
  onSelectStory,
  stories,
}: ActivityStoryGridProps) {
  if (stories.length === 0) {
    return (
      <StateView
        message="아직 올린 스토리가 없습니다."
        title="스토리 없음"
        type="empty"
      />
    );
  }

  const rows = chunkIntoRows(stories, 3);

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((story) => (
            <Pressable
              accessibilityRole="button"
              key={story.id}
              onPress={() => onSelectStory(story)}
              style={styles.tile}
            >
              <Image
                cachePolicy="memory-disk"
                contentFit="cover"
                recyclingKey={story.id}
                source={{
                  // 영상 스토리는 image_url이 영상 URL이라 썸네일(thumbnail_url)을 써야 한다.
                  uri:
                    story.type === "video"
                      ? story.thumbnail_url ?? story.image_url
                      : story.image_url,
                }}
                style={styles.image}
              />
              {story.type === "video" ? (
                <View style={styles.videoBadge}>
                  <Play color={colors.white} fill={colors.white} size={12} />
                </View>
              ) : null}
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>
                  {formatStoryArchiveDate(story.created_at)}
                </Text>
              </View>
              <View style={styles.bottomMeta}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{getStoryStatus(story)}</Text>
                </View>
                <View style={styles.visibilityBadge}>
                  <Text style={styles.visibilityText}>
                    {getVisibilityLabel(story.visibility)}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
          {row.length < 3
            ? Array.from({ length: 3 - row.length }).map((_, spacerIndex) => (
                <View key={`spacer-${spacerIndex}`} style={styles.spacer} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

export const activityStoryDisplay = {
  getStoryStatus,
  getVisibilityLabel,
};

const styles = StyleSheet.create({
  grid: {
    gap: 4,
    padding: 12,
  },
  row: {
    flexDirection: "row",
    gap: 4,
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  spacer: {
    flex: 1,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  videoBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    height: 22,
    width: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  dateBadge: {
    position: "absolute",
    top: 7,
    left: 7,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  dateText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
  },
  bottomMeta: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.42)",
    padding: 7,
  },
  statusBadge: {
    borderRadius: 999,
    backgroundColor: colors.card,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: "900",
  },
  visibilityBadge: {
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  visibilityText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "900",
  },
});
