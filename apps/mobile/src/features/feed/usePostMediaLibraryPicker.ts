import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking } from "react-native";

import type { PostAspectRatio } from "./types";
import { detectAspectRatio, MAX_IMAGES } from "./useWriteForm";

const PAGE_SIZE = 60;
const ASPECT_RATIO_CYCLE: PostAspectRatio[] = [
  "square",
  "portrait",
  "landscape",
];

export type PostLibraryPhoto = {
  height: number;
  id: string;
  uri: string;
  width: number;
};

export type PostLibraryPermissionState =
  | "checking"
  | "denied"
  | "granted"
  | "unavailable";

type UsePostMediaLibraryPickerParams = {
  aspectRatio: PostAspectRatio;
  setAspectRatio: (aspectRatio: PostAspectRatio) => void;
};

function toLibraryPhoto(asset: MediaLibrary.Asset): PostLibraryPhoto {
  return {
    height: asset.height,
    id: asset.id,
    uri: asset.uri,
    width: asset.width,
  };
}

export function usePostMediaLibraryPicker({
  aspectRatio,
  setAspectRatio,
}: UsePostMediaLibraryPickerParams) {
  const [photos, setPhotos] = useState<PostLibraryPhoto[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<PostLibraryPhoto[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<PostLibraryPhoto | null>(null);
  const [permissionState, setPermissionState] =
    useState<PostLibraryPermissionState>("checking");
  const [canRequestPermission, setCanRequestPermission] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const endCursorRef = useRef<string | null>(null);
  const hasNextPageRef = useRef(false);
  const isPageLoadingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const hasInitializedSelectionRef = useRef(false);

  const loadPage = useCallback(
    async (reset: boolean) => {
      if (isPageLoadingRef.current) {
        return;
      }

      if (!reset && !hasNextPageRef.current) {
        return;
      }

      isPageLoadingRef.current = true;
      setErrorMessage("");
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const page = await MediaLibrary.getAssetsAsync({
          after: reset ? undefined : endCursorRef.current ?? undefined,
          first: PAGE_SIZE,
          mediaType: MediaLibrary.MediaType.photo,
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        });
        const nextPhotos = page.assets.map(toLibraryPhoto);

        setPhotos((currentPhotos) => {
          if (reset) {
            return nextPhotos;
          }

          const existingIds = new Set(currentPhotos.map((photo) => photo.id));
          return [
            ...currentPhotos,
            ...nextPhotos.filter((photo) => !existingIds.has(photo.id)),
          ];
        });

        endCursorRef.current = page.endCursor;
        hasNextPageRef.current = page.hasNextPage;
        setHasNextPage(page.hasNextPage);

        const firstPhoto = nextPhotos[0];
        if (!hasInitializedSelectionRef.current && firstPhoto) {
          hasInitializedSelectionRef.current = true;
          setSelectedPhotos([firstPhoto]);
          setPreviewPhoto(firstPhoto);
          setAspectRatio(detectAspectRatio(firstPhoto.width, firstPhoto.height));
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "사진을 불러오지 못했습니다.",
        );
      } finally {
        isPageLoadingRef.current = false;
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [setAspectRatio],
  );

  const requestPermission = useCallback(async () => {
    setPermissionState("checking");
    setErrorMessage("");

    try {
      const permission = await MediaLibrary.requestPermissionsAsync(false, [
        "photo",
      ]);
      setCanRequestPermission(permission.canAskAgain);

      if (!permission.granted) {
        setPermissionState("denied");
        setIsLoading(false);
        return;
      }

      setPermissionState("granted");
      await loadPage(true);
    } catch (error) {
      setPermissionState("denied");
      setIsLoading(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "사진 접근 권한을 확인하지 못했습니다.",
      );
    }
  }, [loadPage]);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    async function initialize() {
      const isAvailable = await MediaLibrary.isAvailableAsync();
      if (!isAvailable) {
        setPermissionState("unavailable");
        setIsLoading(false);
        return;
      }

      const permission = await MediaLibrary.getPermissionsAsync(false, [
        "photo",
      ]);
      setCanRequestPermission(permission.canAskAgain);

      if (permission.granted) {
        setPermissionState("granted");
        await loadPage(true);
        return;
      }

      if (permission.status === "undetermined") {
        await requestPermission();
        return;
      }

      setPermissionState("denied");
      setIsLoading(false);
    }

    void initialize().catch((error: unknown) => {
      setPermissionState("denied");
      setIsLoading(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "사진 보관함을 열지 못했습니다.",
      );
    });
  }, [loadPage, requestPermission]);

  const selectedIndexes = useMemo(
    () =>
      new Map(
        selectedPhotos.map((photo, index) => [photo.id, index + 1] as const),
      ),
    [selectedPhotos],
  );

  function selectPhoto(photo: PostLibraryPhoto) {
    setErrorMessage("");
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
        setErrorMessage(`사진은 최대 ${MAX_IMAGES}장까지 선택할 수 있습니다.`);
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
    setErrorMessage("");

    try {
      // Android의 Asset URI는 이미 로컬 file:// 경로다. 전체 EXIF 조회는
      // ACCESS_MEDIA_LOCATION을 요구하므로 iOS의 ph:// 해석에만 사용한다.
      if (process.env.EXPO_OS === "android") {
        return selectedPhotos.map((photo) => photo.uri);
      }

      return await Promise.all(
        selectedPhotos.map(async (photo) => {
          const info = await MediaLibrary.getAssetInfoAsync(photo.id, {
            shouldDownloadFromNetwork: true,
          });
          return info.localUri ?? info.uri ?? photo.uri;
        }),
      );
    } catch (error) {
      setErrorMessage(
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
    canRequestPermission,
    cycleAspectRatio,
    errorMessage,
    hasNextPage,
    isLoading,
    isLoadingMore,
    isMultiSelect,
    isPreparing,
    loadMore: () => {
      void loadPage(false);
    },
    openSettings: () => {
      void Linking.openSettings().catch(() => undefined);
    },
    permissionState,
    photos,
    previewPhoto,
    requestPermission: () => {
      void requestPermission();
    },
    resolveSelectedImageUris,
    selectPhoto,
    selectedCount: selectedPhotos.length,
    selectedIndexes,
    toggleMultiSelect,
  };
}
