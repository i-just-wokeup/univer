import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

import { colors } from "../../lib/theme";

export type ThumbnailGridItem = {
  id: string;
  image_url: string | null;
};

type PostThumbnailGridProps = {
  items: ThumbnailGridItem[];
  onPressItem?: (id: string) => void;
};

function chunkIntoRows<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }

  return rows;
}

// 3열 1:1 썸네일 그리드. flex:1 행 단위라 픽셀 반올림/테두리와 무관하게 항상 3열을 유지한다.
export function PostThumbnailGrid({
  items,
  onPressItem,
}: PostThumbnailGridProps) {
  const rows = chunkIntoRows(items, 3);

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((item) => (
            <Pressable
              key={item.id}
              disabled={!onPressItem}
              onPress={() => onPressItem?.(item.id)}
              style={styles.tile}
            >
              {item.image_url ? (
                <Image
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  recyclingKey={item.id}
                  source={{ uri: item.image_url }}
                  style={styles.tileImage}
                />
              ) : (
                <View style={styles.tilePlaceholder} />
              )}
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

const styles = StyleSheet.create({
  grid: {
    padding: 12,
    gap: 4,
  },
  row: {
    flexDirection: "row",
    gap: 4,
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    overflow: "hidden",
    borderRadius: 10,
    backgroundColor: colors.neutralFill,
  },
  spacer: {
    flex: 1,
  },
  tileImage: {
    height: "100%",
    width: "100%",
  },
  tilePlaceholder: {
    height: "100%",
    width: "100%",
    backgroundColor: colors.accentSoft,
  },
});
