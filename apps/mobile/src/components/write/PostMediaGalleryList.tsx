import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Camera } from "lucide-react-native";
import { useMemo } from "react";
import type { ReactElement } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import type { PostLibraryPhoto } from "../../features/feed/postMediaLibrary";
import { fontSize, fontWeight, useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { PostMediaGalleryItem } from "./PostMediaGalleryItem";

const COLUMN_COUNT = 3;
const GRID_GAP = 2;

type PostMediaGalleryEntry =
  | { type: "camera" }
  | { photo: PostLibraryPhoto; type: "photo" };

export function getPostMediaGridItemSize(width: number): number {
  return (width - GRID_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;
}

type PostMediaGalleryListProps = {
  disabled: boolean;
  errorMessage: string;
  footerComponent?: ReactElement;
  hasNextPage: boolean;
  isLoadingMore: boolean;
  itemSize: number;
  onLoadMore: () => void;
  onPressCamera: () => void;
  onSelectPhoto: (photo: PostLibraryPhoto) => void;
  photos: PostLibraryPhoto[];
  selectedIndexes: ReadonlyMap<string, number>;
};

export function PostMediaGalleryList({
  disabled,
  errorMessage,
  footerComponent,
  hasNextPage,
  isLoadingMore,
  itemSize,
  onLoadMore,
  onPressCamera,
  onSelectPhoto,
  photos,
  selectedIndexes,
}: PostMediaGalleryListProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const entries = useMemo<PostMediaGalleryEntry[]>(
    () => [
      { type: "camera" },
      ...photos.map((photo) => ({ photo, type: "photo" as const })),
    ],
    [photos],
  );

  return (
    <BottomSheetFlatList
      columnWrapperStyle={styles.row}
      contentContainerStyle={footerComponent ? styles.contentWithFooter : undefined}
      contentInsetAdjustmentBehavior="never"
      data={entries}
      extraData={selectedIndexes}
      keyExtractor={(entry) =>
        entry.type === "camera" ? "post-camera" : entry.photo.id
      }
      ListHeaderComponent={
        errorMessage ? (
          <Text numberOfLines={2} style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null
      }
      ListFooterComponent={
        <>
          {isLoadingMore ? (
            <ActivityIndicator
              color={colors.accent}
              style={styles.footerLoader}
            />
          ) : null}
          {footerComponent}
        </>
      }
      ListFooterComponentStyle={
        footerComponent ? styles.footerWithContent : undefined
      }
      numColumns={COLUMN_COUNT}
      onEndReached={hasNextPage ? onLoadMore : undefined}
      onEndReachedThreshold={0.6}
      renderItem={({ item }) => {
        if (item.type === "camera") {
          return (
            <Pressable
              accessibilityLabel="카메라로 사진 촬영"
              accessibilityRole="button"
              disabled={disabled}
              onPress={onPressCamera}
              style={({ pressed }) => [
                styles.cameraItem,
                { height: itemSize, width: itemSize },
                disabled ? styles.disabled : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Camera color={colors.onMediaGlyph} size={30} strokeWidth={2} />
            </Pressable>
          );
        }

        return (
          <PostMediaGalleryItem
            disabled={disabled}
            itemSize={itemSize}
            onSelect={onSelectPhoto}
            photo={item.photo}
            selectionIndex={selectedIndexes.get(item.photo.id)}
          />
        );
      }}
      showsVerticalScrollIndicator={false}
      style={styles.list}
    />
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  contentWithFooter: {
    flexGrow: 1,
  },
  footerWithContent: {
    flexGrow: 1,
  },
  list: {
    flex: 1,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  cameraItem: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.mediaSheet,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.72,
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
