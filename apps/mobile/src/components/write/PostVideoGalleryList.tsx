import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  type ViewToken,
} from "react-native";

import type { PostLibraryVideo } from "../../features/feed/postMediaLibrary";
import { fontSize, fontWeight, useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { StateView } from "../common/StateView";
import { PostVideoGalleryItem } from "./PostVideoGalleryItem";

const COLUMN_COUNT = 3;
const GRID_GAP = 2;

type PostVideoGalleryListProps = {
  disabled: boolean;
  errorMessage: string;
  hasNextPage: boolean;
  isLoadingMore: boolean;
  itemSize: number;
  onLoadMore: () => void;
  onSelectVideo: (video: PostLibraryVideo) => void;
  selectedVideoId: string | null;
  videos: PostLibraryVideo[];
};

export function PostVideoGalleryList({
  disabled,
  errorMessage,
  hasNextPage,
  isLoadingMore,
  itemSize,
  onLoadMore,
  onSelectVideo,
  selectedVideoId,
  videos,
}: PostVideoGalleryListProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [visibleVideoIds, setVisibleVideoIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: Array<ViewToken<PostLibraryVideo>>;
    }) => {
      setVisibleVideoIds(
        new Set(
          viewableItems
            .map(({ item }) => item.id)
            .filter((id): id is string => typeof id === "string"),
        ),
      );
    },
  ).current;
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 1,
    minimumViewTime: 80,
  }).current;

  return (
    <BottomSheetFlatList
      columnWrapperStyle={styles.row}
      contentInsetAdjustmentBehavior="never"
      data={videos}
      extraData={{ selectedVideoId, visibleVideoIds }}
      keyExtractor={(video) => video.id}
      ListHeaderComponent={
        errorMessage ? (
          <Text numberOfLines={2} style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null
      }
      ListEmptyComponent={
        <StateView
          message="기기 보관함에 표시할 영상이 없습니다."
          title="영상이 없습니다"
        />
      }
      ListFooterComponent={
        isLoadingMore ? (
          <ActivityIndicator color={colors.accent} style={styles.footerLoader} />
        ) : null
      }
      numColumns={COLUMN_COUNT}
      onEndReached={hasNextPage ? onLoadMore : undefined}
      onEndReachedThreshold={0.6}
      onViewableItemsChanged={onViewableItemsChanged}
      renderItem={({ item }) => (
        <PostVideoGalleryItem
          disabled={disabled}
          isSelected={item.id === selectedVideoId}
          itemSize={itemSize}
          onSelect={onSelectVideo}
          shouldLoadThumbnail={visibleVideoIds.has(item.id)}
          video={item}
        />
      )}
      showsVerticalScrollIndicator={false}
      style={styles.list}
      viewabilityConfig={viewabilityConfig}
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
