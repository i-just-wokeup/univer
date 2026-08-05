import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { ActivityIndicator, StyleSheet, Text } from "react-native";

import type { PostLibraryPhoto } from "../../features/feed/postMediaLibrary";
import { fontSize, fontWeight, useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { StateView } from "../common/StateView";
import { PostMediaGalleryItem } from "./PostMediaGalleryItem";

const COLUMN_COUNT = 3;
const GRID_GAP = 2;

export function getPostMediaGridItemSize(width: number): number {
  return (width - GRID_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;
}

type PostMediaGalleryListProps = {
  disabled: boolean;
  errorMessage: string;
  hasNextPage: boolean;
  isLoadingMore: boolean;
  itemSize: number;
  onLoadMore: () => void;
  onSelectPhoto: (photo: PostLibraryPhoto) => void;
  photos: PostLibraryPhoto[];
  selectedIndexes: ReadonlyMap<string, number>;
};

export function PostMediaGalleryList({
  disabled,
  errorMessage,
  hasNextPage,
  isLoadingMore,
  itemSize,
  onLoadMore,
  onSelectPhoto,
  photos,
  selectedIndexes,
}: PostMediaGalleryListProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <BottomSheetFlatList
      columnWrapperStyle={styles.row}
      contentInsetAdjustmentBehavior="never"
      data={photos}
      extraData={selectedIndexes}
      keyExtractor={(photo) => photo.id}
      ListHeaderComponent={
        errorMessage ? (
          <Text numberOfLines={2} style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null
      }
      ListEmptyComponent={
        <StateView
          message="기기 사진 보관함에 표시할 사진이 없습니다."
          title="사진이 없습니다"
        />
      }
      ListFooterComponent={
        isLoadingMore ? (
          <ActivityIndicator
            color={colors.accent}
            style={styles.footerLoader}
          />
        ) : null
      }
      numColumns={COLUMN_COUNT}
      onEndReached={hasNextPage ? onLoadMore : undefined}
      onEndReachedThreshold={0.6}
      renderItem={({ item }) => (
        <PostMediaGalleryItem
          disabled={disabled}
          itemSize={itemSize}
          onSelect={onSelectPhoto}
          photo={item}
          selectionIndex={selectedIndexes.get(item.id)}
        />
      )}
      showsVerticalScrollIndicator={false}
      style={styles.list}
    />
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  list: {
    flex: 1,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  errorText: {
    color: c.danger,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  footerLoader: {
    paddingVertical: 18,
  },
});
