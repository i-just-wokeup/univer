import { Image } from "expo-image";
import { Heart, MessageCircle } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ActivityPost } from "../../features/activity/api";
import { colors } from "../../lib/theme";
import { StateView } from "../common/StateView";

type ActivityPostGridProps = {
  emptyMessage?: string;
  onOpenPost: (postId: string) => void;
  posts: ActivityPost[];
};

function chunkIntoRows<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }

  return rows;
}

export function ActivityPostGrid({
  emptyMessage = "아직 저장한 게시물이 없습니다.",
  onOpenPost,
  posts,
}: ActivityPostGridProps) {
  if (posts.length === 0) {
    return <StateView message={emptyMessage} title="비어 있습니다" type="empty" />;
  }

  const rows = chunkIntoRows(posts, 3);

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((post) => {
            const thumbnail = post.media[0];
            const imageUrl = thumbnail?.thumbnail_url ?? thumbnail?.url ?? null;

            return (
              <Pressable
                accessibilityRole="button"
                key={post.id}
                onPress={() => onOpenPost(post.id)}
                style={styles.tile}
              >
                {imageUrl ? (
                  <Image
                    cachePolicy="memory-disk"
                    contentFit="cover"
                    source={{ uri: imageUrl }}
                    style={styles.image}
                  />
                ) : (
                  <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>텍스트 게시물</Text>
                  </View>
                )}
                <View style={styles.metaBar}>
                  <View style={styles.metaItem}>
                    <Heart color={colors.white} size={13} strokeWidth={2.4} />
                    <Text style={styles.metaText}>{post.likes_count}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MessageCircle
                      color={colors.white}
                      size={13}
                      strokeWidth={2.4}
                    />
                    <Text style={styles.metaText}>{post.comments_count}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
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
  placeholder: {
    height: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
    padding: 8,
  },
  placeholderText: {
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  metaBar: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.48)",
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
  },
});
