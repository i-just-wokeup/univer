import BottomSheet from "@gorhom/bottom-sheet";
import { useCallback, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";

import type { PostMediaCropTransform } from "../../features/feed/postMediaCrop";
import type { PostAspectRatio } from "../../features/feed/types";
import type {
  PostLibraryAlbumOption,
  PostLibraryPhoto,
} from "../../features/feed/postMediaLibrary";
import type { PostLibraryPermissionState } from "../../features/feed/usePostMediaLibrarySource";
import { useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { getAspectRatioValue } from "../../lib/utils/aspectRatio";
import {
  getPostMediaGridItemSize,
  PostMediaGalleryList,
} from "./PostMediaGalleryList";
import { PostMediaAlbumPicker } from "./PostMediaAlbumPicker";
import {
  PostMediaPickerState,
  resolvePostMediaPickerState,
} from "./PostMediaPickerState";
import {
  PostMediaPickerSheetHandle,
  PostMediaPickerSheetHandleProvider,
} from "./PostMediaPickerSheetHandle";
import { POST_MEDIA_PICKER_TOOLBAR_HEIGHT } from "./PostMediaPickerToolbar";
import { PostMediaPreview } from "./PostMediaPreview";
import { usePostMediaPickerSheet } from "./usePostMediaPickerSheet";

type PostMediaPickerBodyProps = {
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
  isMultiSelect: boolean;
  onChangeCropTransform: (transform: PostMediaCropTransform) => void;
  onCycleAspectRatio: () => void;
  onLoadMore: () => void;
  onFocusSelectedPhoto: (photoId: string) => void;
  onRetryAlbums: () => void;
  onSelectAlbum: (albumId: string | null) => void;
  onOpenSettings: () => void;
  onPickVideo: () => void;
  onRequestPermission: () => void;
  onSelectPhoto: (photo: PostLibraryPhoto) => void;
  onToggleMultiSelect: () => void;
  permissionState: PostLibraryPermissionState;
  photos: PostLibraryPhoto[];
  previewPhoto: PostLibraryPhoto | null;
  previewCropTransform: PostMediaCropTransform;
  selectedAlbumId: string | null;
  selectedAlbumKey: string;
  selectedAlbumTitle: string;
  selectedIndexes: ReadonlyMap<string, number>;
  selectedPhotos: PostLibraryPhoto[];
};

export function PostMediaPickerBody({
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
  isMultiSelect,
  onChangeCropTransform,
  onCycleAspectRatio,
  onFocusSelectedPhoto,
  onLoadMore,
  onOpenSettings,
  onPickVideo,
  onRequestPermission,
  onRetryAlbums,
  onSelectAlbum,
  onSelectPhoto,
  onToggleMultiSelect,
  permissionState,
  photos,
  previewPhoto,
  previewCropTransform,
  selectedAlbumId,
  selectedAlbumKey,
  selectedAlbumTitle,
  selectedIndexes,
  selectedPhotos,
}: PostMediaPickerBodyProps) {
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
    canRequestPermission,
    errorMessage,
    isLoading,
    onOpenSettings,
    onRequestPermission,
    permissionState,
    photoCount: photos.length,
  });

  const handleSelectPhoto = useCallback(
    (photo: PostLibraryPhoto) => {
      onSelectPhoto(photo);

      if (!isMultiSelect) {
        collapse();
      }
    },
    [collapse, isMultiSelect, onSelectPhoto],
  );

  const preview = (
    <PostMediaPreview
      aspectRatio={aspectRatio}
      cropTransform={previewCropTransform}
      onChangeCropTransform={onChangeCropTransform}
      onCycleAspectRatio={onCycleAspectRatio}
      photo={previewPhoto}
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
          isMultiSelect={isMultiSelect}
          onFocusSelectedPhoto={onFocusSelectedPhoto}
          onOpenAlbumPicker={() => setIsAlbumPickerOpen(true)}
          onPickVideo={onPickVideo}
          onToggleMultiSelect={onToggleMultiSelect}
          previewPhotoId={previewPhoto?.id ?? null}
          selectedPhotos={selectedPhotos}
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
            <PostMediaGalleryList
              key={selectedAlbumKey}
              disabled={disabled}
              errorMessage={errorMessage}
              hasNextPage={hasNextPage}
              isLoadingMore={isLoadingMore}
              itemSize={itemSize}
              onLoadMore={onLoadMore}
              onSelectPhoto={handleSelectPhoto}
              photos={photos}
              selectedIndexes={selectedIndexes}
            />
          </BottomSheet>
        </PostMediaPickerSheetHandleProvider>
      ) : null}

      <PostMediaAlbumPicker
        albums={albumOptions}
        errorMessage={albumErrorMessage}
        isLoading={isLoadingAlbums}
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
