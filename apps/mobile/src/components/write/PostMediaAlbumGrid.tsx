import { FlatList, StyleSheet, useWindowDimensions } from "react-native";

import type { PostLibraryAlbumOption } from "../../features/feed/postMediaLibrary";
import { PostMediaAlbumCard } from "./PostMediaAlbumCard";

const HORIZONTAL_PADDING = 16;
const CARD_GAP = 12;

type PostMediaAlbumGridProps = {
  albums: PostLibraryAlbumOption[];
  onSelect: (albumId: string | null) => void;
  selectedAlbumId: string | null;
};

export function PostMediaAlbumGrid({
  albums,
  onSelect,
  selectedAlbumId,
}: PostMediaAlbumGridProps) {
  const { width } = useWindowDimensions();
  const cardWidth = (width - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

  return (
    <FlatList
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      data={albums}
      keyExtractor={(album) =>
        album.id === null ? "recent" : `album:${album.id}`
      }
      numColumns={2}
      renderItem={({ item }) => (
        <PostMediaAlbumCard
          album={item}
          isSelected={item.id === selectedAlbumId}
          onPress={onSelect}
          width={cardWidth}
        />
      )}
      showsVerticalScrollIndicator={false}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    gap: 20,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 16,
  },
  row: {
    gap: CARD_GAP,
  },
});
