import { useEffect, useMemo, useRef, useState } from "react";

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
  isMultiSelect: boolean;
  previewPhoto: PostLibraryPhoto | null;
  selectedPhotos: PostLibraryPhoto[];
};

export function usePostMediaLibraryPicker({
  aspectRatio,
  setAspectRatio,
}: UsePostMediaLibraryPickerParams) {
  const source = usePostMediaLibrarySource();
  const [selectedPhotos, setSelectedPhotos] = useState<PostLibraryPhoto[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<PostLibraryPhoto | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [selectionErrorMessage, setSelectionErrorMessage] = useState("");
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const hasInitializedSelectionRef = useRef(false);
  const selectionEditSnapshotRef = useRef<SelectionEditSnapshot | null>(null);

  useEffect(() => {
    const firstPhoto = source.photos[0];
    if (hasInitializedSelectionRef.current || !firstPhoto) {
      return;
    }

    hasInitializedSelectionRef.current = true;
    setSelectedPhotos([firstPhoto]);
    setPreviewPhoto(firstPhoto);
    setAspectRatio(detectAspectRatio(firstPhoto.width, firstPhoto.height));
  }, [setAspectRatio, source.photos]);

  const selectedIndexes = useMemo(
    () =>
      new Map(
        selectedPhotos.map((photo, index) => [photo.id, index + 1] as const),
      ),
    [selectedPhotos],
  );

  function clearErrors() {
    setSelectionErrorMessage("");
    source.clearErrorMessage();
  }

  function beginSelectionEdit() {
    selectionEditSnapshotRef.current = {
      aspectRatio,
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
      setPreviewPhoto(nextFirstPhoto ?? source.photos[0] ?? null);
    }
    if (index === 0 && nextFirstPhoto) {
      setAspectRatio(
        detectAspectRatio(nextFirstPhoto.width, nextFirstPhoto.height),
      );
    }
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
      return await resolvePostLibraryPhotoUris(selectedPhotos);
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
    isMultiSelect,
    isPreparing,
    previewPhoto,
    removeSelectedPhoto,
    resolveSelectedImageUris,
    selectPhoto,
    selectedCount: selectedPhotos.length,
    selectedIndexes,
    toggleMultiSelect,
  };
}
