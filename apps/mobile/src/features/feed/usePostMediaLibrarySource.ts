import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking } from "react-native";

import {
  getPostLibraryAlbums,
  getPostLibraryPermission,
  getPostLibraryPhotoPage,
  isPostLibraryAvailable,
  requestPostLibraryPermission,
} from "./postMediaLibrary";
import type {
  PostLibraryAlbum,
  PostLibraryAlbumOption,
  PostLibraryPhoto,
} from "./postMediaLibrary";

const PAGE_SIZE = 60;

export type PostLibraryPermissionState =
  | "checking"
  | "denied"
  | "granted"
  | "unavailable";

export function usePostMediaLibrarySource() {
  const [photos, setPhotos] = useState<PostLibraryPhoto[]>([]);
  const [albums, setAlbums] = useState<PostLibraryAlbum[]>([]);
  const [recentAlbum, setRecentAlbum] =
    useState<PostLibraryAlbumOption | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [permissionState, setPermissionState] =
    useState<PostLibraryPermissionState>("checking");
  const [canRequestPermission, setCanRequestPermission] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [albumErrorMessage, setAlbumErrorMessage] = useState("");
  const endCursorRef = useRef<string | null>(null);
  const hasNextPageRef = useRef(false);
  const pageLoadingGenerationRef = useRef<number | null>(null);
  const requestGenerationRef = useRef(0);
  const selectedAlbumIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  const loadPage = useCallback(
    async (reset: boolean, albumId = selectedAlbumIdRef.current) => {
      if (!reset) {
        if (pageLoadingGenerationRef.current !== null) {
          return;
        }
        if (!hasNextPageRef.current) {
          return;
        }
      }

      const generation = reset
        ? requestGenerationRef.current + 1
        : requestGenerationRef.current;
      if (reset) {
        requestGenerationRef.current = generation;
        endCursorRef.current = null;
        hasNextPageRef.current = false;
        setHasNextPage(false);
        setPhotos([]);
        setIsLoadingMore(false);
      }

      pageLoadingGenerationRef.current = generation;
      setErrorMessage("");
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const page = await getPostLibraryPhotoPage({
          after: reset ? undefined : endCursorRef.current ?? undefined,
          albumId,
          first: PAGE_SIZE,
        });
        if (
          generation !== requestGenerationRef.current ||
          albumId !== selectedAlbumIdRef.current
        ) {
          return;
        }

        setPhotos((currentPhotos) => {
          if (reset) {
            return page.photos;
          }

          const existingIds = new Set(currentPhotos.map((photo) => photo.id));
          return [
            ...currentPhotos,
            ...page.photos.filter((photo) => !existingIds.has(photo.id)),
          ];
        });
        endCursorRef.current = page.endCursor;
        hasNextPageRef.current = page.hasNextPage;
        setHasNextPage(page.hasNextPage);
        if (reset && albumId === null) {
          const coverPhoto = page.photos[0];
          setRecentAlbum(
            coverPhoto
              ? {
                  assetCount: page.totalCount,
                  coverPhoto,
                  id: null,
                  title: "최근 항목",
                }
              : null,
          );
        }
      } catch (error) {
        if (
          generation !== requestGenerationRef.current ||
          albumId !== selectedAlbumIdRef.current
        ) {
          return;
        }
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "사진을 불러오지 못했습니다.",
        );
      } finally {
        if (pageLoadingGenerationRef.current === generation) {
          pageLoadingGenerationRef.current = null;
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [],
  );

  const loadAlbums = useCallback(async () => {
    setIsLoadingAlbums(true);
    setAlbumErrorMessage("");

    try {
      setAlbums(await getPostLibraryAlbums());
    } catch (error) {
      setAlbums([]);
      setAlbumErrorMessage(
        error instanceof Error
          ? error.message
          : "앨범을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoadingAlbums(false);
    }
  }, []);

  const loadGrantedLibrary = useCallback(async () => {
    await Promise.all([loadPage(true), loadAlbums()]);
  }, [loadAlbums, loadPage]);

  const requestPermission = useCallback(async () => {
    setPermissionState("checking");
    setErrorMessage("");

    try {
      const permission = await requestPostLibraryPermission();
      setCanRequestPermission(permission.canAskAgain);

      if (!permission.granted) {
        setPermissionState("denied");
        setIsLoading(false);
        return;
      }

      setPermissionState("granted");
      await loadGrantedLibrary();
    } catch (error) {
      setPermissionState("denied");
      setIsLoading(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "사진 접근 권한을 확인하지 못했습니다.",
      );
    }
  }, [loadGrantedLibrary]);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    async function initialize() {
      const isAvailable = await isPostLibraryAvailable();
      if (!isAvailable) {
        setPermissionState("unavailable");
        setIsLoading(false);
        return;
      }

      const permission = await getPostLibraryPermission();
      setCanRequestPermission(permission.canAskAgain);

      if (permission.granted) {
        setPermissionState("granted");
        await loadGrantedLibrary();
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
  }, [loadGrantedLibrary, requestPermission]);

  const albumOptions = useMemo<PostLibraryAlbumOption[]>(
    () => (recentAlbum ? [recentAlbum, ...albums] : albums),
    [albums, recentAlbum],
  );
  const selectedAlbumTitle = useMemo(
    () =>
      selectedAlbumId === null
        ? "최근 항목"
        : albumOptions.find((album) => album.id === selectedAlbumId)?.title ??
          "앨범",
    [albumOptions, selectedAlbumId],
  );

  const selectAlbum = useCallback(
    (albumId: string | null) => {
      if (albumId === selectedAlbumIdRef.current) {
        return;
      }

      selectedAlbumIdRef.current = albumId;
      setSelectedAlbumId(albumId);
      void loadPage(true, albumId);
    },
    [loadPage],
  );

  return {
    albumErrorMessage,
    albumOptions,
    canRequestPermission,
    clearErrorMessage: () => setErrorMessage(""),
    errorMessage,
    hasNextPage,
    isLoading,
    isLoadingAlbums,
    isLoadingMore,
    loadMore: () => {
      void loadPage(false);
    },
    openSettings: () => {
      void Linking.openSettings().catch(() => undefined);
    },
    permissionState,
    photos,
    requestPermission: () => {
      void requestPermission();
    },
    retryAlbums: () => {
      void loadAlbums();
    },
    selectAlbum,
    selectedAlbumId,
    selectedAlbumKey: selectedAlbumId ?? "recent",
    selectedAlbumTitle,
  };
}
