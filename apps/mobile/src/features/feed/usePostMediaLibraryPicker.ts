import { useEffect, useMemo, useRef, useState } from "react";

import {
  cropPostLibraryPhotos,
  DEFAULT_POST_MEDIA_CROP_TRANSFORM,
  normalizePostMediaCropTransform,
} from "./postMediaCrop";
import type {
  PostMediaCropTransform,
  PostMediaCropTransforms,
} from "./postMediaCrop";
import type { PostLibraryPhoto } from "./postMediaLibrary";
import { resolvePostLibraryPhotoUris } from "./postMediaLibrary";
import type { PostAspectRatio } from "./types";
import { usePostMediaLibrarySource } from "./usePostMediaLibrarySource";
import { detectAspectRatio, MAX_IMAGES } from "./useWriteForm";

const ASPECT_RATIO_CYCLE: PostAspectRatio[] = [
  "square",
  "portrait",
  "landscape",
];

type UsePostMediaLibraryPickerParams = {
  aspectRatio: PostAspectRatio;
  setAspectRatio: (aspectRatio: PostAspectRatio) => void;
};

type SelectionEditSnapshot = {
  aspectRatio: PostAspectRatio;
  cropTransforms: PostMediaCropTransforms;
  isMultiSelect: boolean;
  previewPhoto: PostLibraryPhoto | null;
  selectedPhotos: PostLibraryPhoto[];
};

export function usePostMediaLibraryPicker({
  aspectRatio,
  setAspectRatio,
}: UsePostMediaLibraryPickerParams) {
  const source = usePostMediaLibrarySource("photo");
  const photos = useMemo(
    () =>
      source.assets.filter(
        (asset): asset is PostLibraryPhoto => asset.mediaType === "photo",
      ),
    [source.assets],
  );
  const [selectedPhotos, setSelectedPhotos] = useState<PostLibraryPhoto[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<PostLibraryPhoto | null>(null);
  const [cropTransforms, setCropTransforms] =
    useState<PostMediaCropTransforms>({});
  const [isPreparing, setIsPreparing] = useState(false);
  const [selectionErrorMessage, setSelectionErrorMessage] = useState("");
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const hasInitializedSelectionRef = useRef(false);
  const selectionEditSnapshotRef = useRef<SelectionEditSnapshot | null>(null);

  useEffect(() => {
    const firstPhoto = photos[0];
    if (hasInitializedSelectionRef.current || !firstPhoto) {
      return;
    }

    hasInitializedSelectionRef.current = true;
    setSelectedPhotos([firstPhoto]);
    setPreviewPhoto(firstPhoto);
    setAspectRatio(detectAspectRatio(firstPhoto.width, firstPhoto.height));
  }, [photos, setAspectRatio]);

  const selectedIndexes = useMemo(
    () =>
      new Map(
        selectedPhotos.map((photo, index) => [photo.id, index + 1] as const),
      ),
    [selectedPhotos],
  );
  const previewCropTransform = useMemo(
    () =>
      previewPhoto
        ? cropTransforms[previewPhoto.id] ??
          DEFAULT_POST_MEDIA_CROP_TRANSFORM
        : DEFAULT_POST_MEDIA_CROP_TRANSFORM,
    [cropTransforms, previewPhoto],
  );

  function clearErrors() {
    setSelectionErrorMessage("");
    source.clearErrorMessage();
  }

  function beginSelectionEdit() {
    selectionEditSnapshotRef.current = {
      aspectRatio,
      cropTransforms: { ...cropTransforms },
      isMultiSelect,
      previewPhoto,
      selectedPhotos: [...selectedPhotos],
    };
  }

  function cancelSelectionEdit() {
    const snapshot = selectionEditSnapshotRef.current;
    if (!snapshot) {
      return;
    }

    setSelectedPhotos(snapshot.selectedPhotos);
    setPreviewPhoto(snapshot.previewPhoto);
    setCropTransforms(snapshot.cropTransforms);
    setIsMultiSelect(snapshot.isMultiSelect);
    setAspectRatio(snapshot.aspectRatio);
    selectionEditSnapshotRef.current = null;
    clearErrors();
  }

  function commitSelectionEdit() {
    selectionEditSnapshotRef.current = null;
  }

  function selectPhoto(photo: PostLibraryPhoto) {
    clearErrors();
    setPreviewPhoto(photo);

    if (!isMultiSelect) {
      setSelectedPhotos([photo]);
      setAspectRatio(detectAspectRatio(photo.width, photo.height));
      return;
    }

    const selectedIndex = selectedPhotos.findIndex(
      (selectedPhoto) => selectedPhoto.id === photo.id,
    );
    let nextSelectedPhotos: PostLibraryPhoto[];

    if (selectedIndex >= 0) {
      nextSelectedPhotos = selectedPhotos.filter(
        (selectedPhoto) => selectedPhoto.id !== photo.id,
      );
    } else {
      if (selectedPhotos.length >= MAX_IMAGES) {
        setSelectionErrorMessage(
          `사진은 최대 ${MAX_IMAGES}장까지 선택할 수 있습니다.`,
        );
        return;
      }
      nextSelectedPhotos = [...selectedPhotos, photo];
    }

    const previousFirstId = selectedPhotos[0]?.id;
    const nextFirstPhoto = nextSelectedPhotos[0];
    setSelectedPhotos(nextSelectedPhotos);

    if (nextFirstPhoto && nextFirstPhoto.id !== previousFirstId) {
      setAspectRatio(
        detectAspectRatio(nextFirstPhoto.width, nextFirstPhoto.height),
      );
    }

    if (selectedIndex >= 0) {
      setPreviewPhoto(nextFirstPhoto ?? photo);
    }
  }

  function focusSelectedPhoto(photoId: string) {
    const selectedPhoto = selectedPhotos.find((photo) => photo.id === photoId);
    if (!selectedPhoto) {
      return;
    }

    clearErrors();
    setPreviewPhoto(selectedPhoto);
  }

  function resetSelection() {
    setSelectedPhotos([]);
    setPreviewPhoto(null);
    setCropTransforms({});
    setIsMultiSelect(false);
    selectionEditSnapshotRef.current = null;
    clearErrors();
  }

  function toggleMultiSelect() {
    if (isMultiSelect && selectedPhotos.length > 1) {
      const firstPhoto = selectedPhotos[0];
      setSelectedPhotos(firstPhoto ? [firstPhoto] : []);
      setPreviewPhoto(firstPhoto ?? previewPhoto);
    }
    setIsMultiSelect(!isMultiSelect);
  }

  function removeSelectedPhoto(index: number) {
    const removedPhoto = selectedPhotos[index];
    const nextSelectedPhotos = selectedPhotos.filter(
      (_, currentIndex) => currentIndex !== index,
    );
    const nextFirstPhoto = nextSelectedPhotos[0];

    setSelectedPhotos(nextSelectedPhotos);
    if (removedPhoto?.id === previewPhoto?.id) {
      setPreviewPhoto(nextFirstPhoto ?? photos[0] ?? null);
    }
    if (index === 0 && nextFirstPhoto) {
      setAspectRatio(
        detectAspectRatio(nextFirstPhoto.width, nextFirstPhoto.height),
      );
    }
  }

  function updatePreviewCropTransform(transform: PostMediaCropTransform) {
    if (!previewPhoto) {
      return;
    }

    const normalizedTransform = normalizePostMediaCropTransform(transform);
    setCropTransforms((currentTransforms) => ({
      ...currentTransforms,
      [previewPhoto.id]: normalizedTransform,
    }));
  }

  function cycleAspectRatio() {
    const currentIndex = ASPECT_RATIO_CYCLE.indexOf(aspectRatio);
    const nextIndex = (currentIndex + 1) % ASPECT_RATIO_CYCLE.length;
    setAspectRatio(ASPECT_RATIO_CYCLE[nextIndex] ?? "square");
  }

  async function resolveSelectedImageUris(): Promise<string[] | null> {
    if (selectedPhotos.length === 0) {
      return null;
    }

    setIsPreparing(true);
    clearErrors();

    try {
      const sourceUris = await resolvePostLibraryPhotoUris(selectedPhotos);
      return await cropPostLibraryPhotos(
        selectedPhotos,
        sourceUris,
        aspectRatio,
        cropTransforms,
      );
    } catch (error) {
      setSelectionErrorMessage(
        error instanceof Error
          ? error.message
          : "선택한 사진을 준비하지 못했습니다.",
      );
      return null;
    } finally {
      setIsPreparing(false);
    }
  }

  return {
    ...source,
    beginSelectionEdit,
    cancelSelectionEdit,
    commitSelectionEdit,
    cycleAspectRatio,
    errorMessage: selectionErrorMessage || source.errorMessage,
    focusSelectedPhoto,
    isMultiSelect,
    isPreparing,
    photos,
    previewCropTransform,
    previewPhoto,
    removeSelectedPhoto,
    resetSelection,
    resolveSelectedImageUris,
    selectPhoto,
    selectedCount: selectedPhotos.length,
    selectedIndexes,
    selectedPhotos,
    toggleMultiSelect,
    updatePreviewCropTransform,
  };
}
