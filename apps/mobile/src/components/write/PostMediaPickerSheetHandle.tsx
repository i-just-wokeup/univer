import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { View } from "react-native";

import type {
  PostLibraryMediaType,
  PostLibraryPhoto,
} from "../../features/feed/postMediaLibrary";
import { PostMediaCropThumbnailStrip } from "./PostMediaCropThumbnailStrip";
import { PostMediaPickerToolbar } from "./PostMediaPickerToolbar";

type PostMediaPickerSheetHandleContextValue = {
  albumTitle: string;
  disabled: boolean;
  isMultiSelect: boolean;
  mediaType: PostLibraryMediaType;
  onFocusSelectedPhoto: (photoId: string) => void;
  onOpenAlbumPicker: () => void;
  onSwitchMediaType: () => void;
  onToggleMultiSelect: () => void;
  previewPhotoId: string | null;
  selectedPhotos: PostLibraryPhoto[];
};

const PostMediaPickerSheetHandleContext =
  createContext<PostMediaPickerSheetHandleContextValue | null>(null);

type PostMediaPickerSheetHandleProviderProps =
  PostMediaPickerSheetHandleContextValue & {
    children: ReactNode;
  };

export function PostMediaPickerSheetHandleProvider({
  albumTitle,
  children,
  disabled,
  isMultiSelect,
  mediaType,
  onFocusSelectedPhoto,
  onOpenAlbumPicker,
  onSwitchMediaType,
  onToggleMultiSelect,
  previewPhotoId,
  selectedPhotos,
}: PostMediaPickerSheetHandleProviderProps) {
  return (
    <PostMediaPickerSheetHandleContext.Provider
      value={{
        albumTitle,
        disabled,
        isMultiSelect,
        mediaType,
        onFocusSelectedPhoto,
        onOpenAlbumPicker,
        onSwitchMediaType,
        onToggleMultiSelect,
        previewPhotoId,
        selectedPhotos,
      }}
    >
      {children}
    </PostMediaPickerSheetHandleContext.Provider>
  );
}

export function PostMediaPickerSheetHandle() {
  const context = useContext(PostMediaPickerSheetHandleContext);
  if (!context) {
    return null;
  }

  return (
    <View>
      <PostMediaCropThumbnailStrip
        isVisible={
          context.mediaType === "photo" &&
          context.isMultiSelect &&
          context.selectedPhotos.length >= 2
        }
        onFocusPhoto={context.onFocusSelectedPhoto}
        photos={context.selectedPhotos}
        previewPhotoId={context.previewPhotoId}
      />
      <PostMediaPickerToolbar
        albumTitle={context.albumTitle}
        disabled={context.disabled}
        isMultiSelect={context.isMultiSelect}
        mediaType={context.mediaType}
        onOpenAlbumPicker={context.onOpenAlbumPicker}
        onSwitchMediaType={context.onSwitchMediaType}
        onToggleMultiSelect={context.onToggleMultiSelect}
      />
    </View>
  );
}
