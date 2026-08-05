import BottomSheet from "@gorhom/bottom-sheet";
import { useCallback } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";

import type { PostAspectRatio } from "../../features/feed/types";
import type {
  PostLibraryPermissionState,
  PostLibraryPhoto,
} from "../../features/feed/usePostMediaLibraryPicker";
import { useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { getAspectRatioValue } from "../../lib/utils/aspectRatio";
import {
  getPostMediaGridItemSize,
  PostMediaGalleryList,
} from "./PostMediaGalleryList";
import {
  PostMediaPickerState,
  resolvePostMediaPickerState,
} from "./PostMediaPickerState";
import {
  POST_MEDIA_PICKER_TOOLBAR_HEIGHT,
  PostMediaPickerToolbar,
} from "./PostMediaPickerToolbar";
import { PostMediaPreview } from "./PostMediaPreview";
import { usePostMediaPickerSheet } from "./usePostMediaPickerSheet";

type PostMediaPickerBodyProps = {
  aspectRatio: PostAspectRatio;
  canRequestPermission: boolean;
  disabled: boolean;
  errorMessage: string;
  hasNextPage: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isMultiSelect: boolean;
  onCycleAspectRatio: () => void;
  onLoadMore: () => void;
  onOpenSettings: () => void;
  onRequestPermission: () => void;
  onSelectPhoto: (photo: PostLibraryPhoto) => void;
  onToggleMultiSelect: () => void;
  permissionState: PostLibraryPermissionState;
  photos: PostLibraryPhoto[];
  previewPhoto: PostLibraryPhoto | null;
  selectedIndexes: ReadonlyMap<string, number>;
};

export function PostMediaPickerBody({
  aspectRatio,
  canRequestPermission,
  disabled,
  errorMessage,
  hasNextPage,
  isLoading,
  isLoadingMore,
  isMultiSelect,
  onCycleAspectRatio,
  onLoadMore,
  onOpenSettings,
  onRequestPermission,
  onSelectPhoto,
  onToggleMultiSelect,
  permissionState,
  photos,
  previewPhoto,
  selectedIndexes,
}: PostMediaPickerBodyProps) {
  const styles = useThemedStyles(makeStyles);
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

  const renderSheetHandle = useCallback(
    () => (
      <PostMediaPickerToolbar
        disabled={disabled}
        isMultiSelect={isMultiSelect}
        onToggleMultiSelect={onToggleMultiSelect}
      />
    ),
    [disabled, isMultiSelect, onToggleMultiSelect],
  );

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
        <BottomSheet
          animateOnMount={false}
          backgroundStyle={styles.sheetBackground}
          enableDynamicSizing={false}
          enableOverDrag={false}
          enablePanDownToClose={false}
          handleComponent={renderSheetHandle}
          index={0}
          ref={sheetRef}
          snapPoints={snapPoints}
          style={styles.sheet}
        >
          <PostMediaGalleryList
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
      ) : null}
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
