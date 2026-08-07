import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import type { PostLibraryAlbumOption } from "../../features/feed/postMediaLibrary";
import type { PostLibraryMediaType } from "../../features/feed/postMediaLibrary";
import {
  fontSize,
  fontWeight,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { PostMediaAlbumCard } from "./PostMediaAlbumCard";

const HORIZONTAL_PADDING = 16;
const CARD_GAP = 10;

type PostMediaAlbumOverviewProps = {
  albums: PostLibraryAlbumOption[];
  mediaType: PostLibraryMediaType;
  onSelect: (albumId: string | null) => void;
  onShowAll: () => void;
  selectedAlbumId: string | null;
};

export function PostMediaAlbumOverview({
  albums,
  mediaType,
  onSelect,
  onShowAll,
  selectedAlbumId,
}: PostMediaAlbumOverviewProps) {
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const cardWidth = (width - HORIZONTAL_PADDING * 2 - CARD_GAP * 2) / 3;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {mediaType === "video" ? "영상 앨범" : "사진첩"}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onShowAll}
          style={({ pressed }) => (pressed ? styles.pressed : null)}
        >
          <Text style={styles.showAllText}>모두 보기</Text>
        </Pressable>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={albums}
        horizontal
        keyExtractor={(album) =>
          album.id === null ? "recent" : `album:${album.id}`
        }
        renderItem={({ item }) => (
          <PostMediaAlbumCard
            album={item}
            isSelected={item.id === selectedAlbumId}
            onPress={onSelect}
            width={cardWidth}
          />
        )}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 12,
  },
  sectionTitle: {
    color: c.muted,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.bold,
  },
  showAllText: {
    color: c.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
  },
  listContent: {
    gap: CARD_GAP,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  pressed: {
    opacity: 0.65,
  },
});
