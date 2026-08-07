import BottomSheet from "@gorhom/bottom-sheet";
import { useCallback, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";

import type {
  PostLibraryAlbumOption,
  PostLibraryPhoto,
  PostLibraryVideo,
} from "../../features/feed/postMediaLibrary";
import type { PostAspectRatio } from "../../features/feed/types";
import type { PostLibraryPermissionState } from "../../features/feed/usePostMediaLibrarySource";
import { useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { getAspectRatioValue } from "../../lib/utils/aspectRatio";
import { PostMediaAlbumPicker } from "./PostMediaAlbumPicker";
import { getPostMediaGridItemSize } from "./PostMediaGalleryList";
import {
  PostMediaPickerState,
  resolvePostMediaPickerState,
} from "./PostMediaPickerState";
import {
  PostMediaPickerSheetHandle,
  PostMediaPickerSheetHandleProvider,
} from "./PostMediaPickerSheetHandle";
import { POST_MEDIA_PICKER_TOOLBAR_HEIGHT } from "./PostMediaPickerToolbar";
import { PostVideoGalleryList } from "./PostVideoGalleryList";
import { PostVideoPickerPreview } from "./PostVideoPickerPreview";
import { usePostMediaPickerSheet } from "./usePostMediaPickerSheet";

const EMPTY_PHOTOS: PostLibraryPhoto[] = [];
const NOOP = () => undefined;

type PostVideoPickerBodyProps = {
  albumErrorMessage: string;
  albumOptions: PostLibraryAlbumOption[];
  aspectRatio: PostAspectRatio;
  canRequestPermission: boolean;
  disabled: boolean;
  errorMessage: string;
  hasNextPage: boolean;
  isLoading: boolean;
  isLoadingAlbums: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onOpenSettings: () => void;
  onRequestPermission: () => void;
  onRetryAlbums: () => void;
  onSelectAlbum: (albumId: string | null) => void;
  onSelectVideo: (video: PostLibraryVideo) => void;
  onSwitchToPhotos: () => void;
  permissionState: PostLibraryPermissionState;
  playbackUri: string | null;
  selectedAlbumId: string | null;
  selectedAlbumKey: string;
  selectedAlbumTitle: string;
  selectedVideo: PostLibraryVideo | null;
  videos: PostLibraryVideo[];
};

export function PostVideoPickerBody({
  albumErrorMessage,
  albumOptions,
  aspectRatio,
  canRequestPermission,
  disabled,
  errorMessage,
  hasNextPage,
  isLoading,
  isLoadingAlbums,
  isLoadingMore,
  onLoadMore,
  onOpenSettings,
  onRequestPermission,
  onRetryAlbums,
  onSelectAlbum,
  onSelectVideo,
  onSwitchToPhotos,
  permissionState,
  playbackUri,
  selectedAlbumId,
  selectedAlbumKey,
  selectedAlbumTitle,
  selectedVideo,
  videos,
}: PostVideoPickerBodyProps) {
  const styles = useThemedStyles(makeStyles);
  const [isAlbumPickerOpen, setIsAlbumPickerOpen] = useState(false);
  const { width } = useWindowDimensions();
  const itemSize = getPostMediaGridItemSize(width);
  const {
    collapse,
    handleContainerLayout,
    isReady,
    sheetRef,
    snapPoints,
  } = usePostMediaPickerSheet({
    gridItemSize: itemSize,
    previewAspectRatio: getAspectRatioValue(aspectRatio),
    toolbarHeight: POST_MEDIA_PICKER_TOOLBAR_HEIGHT,
    width,
  });
  const pickerState = resolvePostMediaPickerState({
    assetCount: videos.length,
    canRequestPermission,
    errorMessage,
    isLoading,
    mediaType: "video",
    onOpenSettings,
    onRequestPermission,
    permissionState,
  });

  const handleSelectVideo = useCallback(
    (video: PostLibraryVideo) => {
      onSelectVideo(video);
      collapse();
    },
    [collapse, onSelectVideo],
  );

  const preview = (
    <PostVideoPickerPreview
      aspectRatio={aspectRatio}
      playbackUri={playbackUri}
      video={selectedVideo}
    />
  );

  if (pickerState) {
    return (
      <View style={styles.container}>
        {preview}
        <PostMediaPickerState {...pickerState} />
      </View>
    );
  }

  return (
    <View onLayout={handleContainerLayout} style={styles.container}>
      {preview}

      {isReady ? (
        <PostMediaPickerSheetHandleProvider
          albumTitle={selectedAlbumTitle}
          disabled={disabled}
          isMultiSelect={false}
          mediaType="video"
          onFocusSelectedPhoto={NOOP}
          onOpenAlbumPicker={() => setIsAlbumPickerOpen(true)}
          onSwitchMediaType={onSwitchToPhotos}
          onToggleMultiSelect={NOOP}
          previewPhotoId={null}
          selectedPhotos={EMPTY_PHOTOS}
        >
          <BottomSheet
            animateOnMount={false}
            backgroundStyle={styles.sheetBackground}
            enableDynamicSizing={false}
            enableOverDrag={false}
            enablePanDownToClose={false}
            handleComponent={PostMediaPickerSheetHandle}
            index={0}
            ref={sheetRef}
            snapPoints={snapPoints}
            style={styles.sheet}
          >
            <PostVideoGalleryList
              key={selectedAlbumKey}
              disabled={disabled}
              errorMessage={errorMessage}
              hasNextPage={hasNextPage}
              isLoadingMore={isLoadingMore}
              itemSize={itemSize}
              onLoadMore={onLoadMore}
              onSelectVideo={handleSelectVideo}
              selectedVideoId={selectedVideo?.id ?? null}
              videos={videos}
            />
          </BottomSheet>
        </PostMediaPickerSheetHandleProvider>
      ) : null}

      <PostMediaAlbumPicker
        albums={albumOptions}
        errorMessage={albumErrorMessage}
        isLoading={isLoadingAlbums}
        mediaType="video"
        onClose={() => setIsAlbumPickerOpen(false)}
        onRetry={onRetryAlbums}
        onSelect={onSelectAlbum}
        selectedAlbumId={selectedAlbumId}
        visible={isAlbumPickerOpen}
      />
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    backgroundColor: c.accentSoft,
  },
  sheet: {
    zIndex: 2,
  },
  sheetBackground: {
    borderRadius: 0,
    backgroundColor: c.accentSoft,
  },
});
