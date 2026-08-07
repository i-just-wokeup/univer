import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking } from "react-native";

import {
  getPostLibraryAssetPage,
  getPostLibraryAlbums,
  getPostLibraryPermission,
  isPostLibraryAvailable,
  requestPostLibraryPermission,
  updatePostLibraryPermissionSelection,
} from "./postMediaLibrary";
import type {
  PostLibraryAlbum,
  PostLibraryAlbumOption,
  PostLibraryAsset,
  PostLibraryMediaType,
} from "./postMediaLibrary";

const PAGE_SIZE = 60;

export type PostLibraryPermissionState =
  | "checking"
  | "denied"
  | "granted"
  | "limited"
  | "unavailable";

function getGrantedPermissionState(
  permission: Awaited<ReturnType<typeof getPostLibraryPermission>>,
): PostLibraryPermissionState {
  return permission.accessPrivileges === "limited" ? "limited" : "granted";
}

export function usePostMediaLibrarySource(
  mediaType: PostLibraryMediaType,
  enabled = true,
) {
  const [assets, setAssets] = useState<PostLibraryAsset[]>([]);
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
  const mediaLabel = mediaType === "video" ? "영상" : "사진";

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
        setAssets([]);
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
        const page = await getPostLibraryAssetPage({
          after: reset ? undefined : endCursorRef.current ?? undefined,
          albumId,
          first: PAGE_SIZE,
          mediaType,
        });
        if (
          generation !== requestGenerationRef.current ||
          albumId !== selectedAlbumIdRef.current
        ) {
          return;
        }

        setAssets((currentAssets) => {
          if (reset) {
            return page.assets;
          }

          const existingIds = new Set(currentAssets.map((asset) => asset.id));
          return [
            ...currentAssets,
            ...page.assets.filter((asset) => !existingIds.has(asset.id)),
          ];
        });
        endCursorRef.current = page.endCursor;
        hasNextPageRef.current = page.hasNextPage;
        setHasNextPage(page.hasNextPage);
        if (reset && albumId === null) {
          const coverAsset = page.assets[0];
          setRecentAlbum(
            coverAsset
              ? {
                  assetCount: page.totalCount,
                  coverAsset,
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
            : `${mediaLabel}을 불러오지 못했습니다.`,
        );
      } finally {
        if (pageLoadingGenerationRef.current === generation) {
          pageLoadingGenerationRef.current = null;
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [mediaLabel, mediaType],
  );

  const loadAlbums = useCallback(async () => {
    setIsLoadingAlbums(true);
    setAlbumErrorMessage("");

    try {
      setAlbums(await getPostLibraryAlbums(mediaType));
    } catch (error) {
      setAlbums([]);
      setAlbumErrorMessage(
        error instanceof Error
          ? error.message
          : `${mediaLabel} 앨범을 불러오지 못했습니다.`,
      );
    } finally {
      setIsLoadingAlbums(false);
    }
  }, [mediaLabel, mediaType]);

  const loadGrantedLibrary = useCallback(async () => {
    await Promise.all([loadPage(true), loadAlbums()]);
  }, [loadAlbums, loadPage]);

  const requestPermission = useCallback(async () => {
    setPermissionState("checking");
    setErrorMessage("");

    try {
      const permission =
        permissionState === "limited"
          ? await updatePostLibraryPermissionSelection(mediaType)
          : await requestPostLibraryPermission(mediaType);
      setCanRequestPermission(permission.canAskAgain);

      if (!permission.granted) {
        setPermissionState("denied");
        setIsLoading(false);
        return;
      }

      setPermissionState(getGrantedPermissionState(permission));
      await loadGrantedLibrary();
    } catch (error) {
      setPermissionState("denied");
      setIsLoading(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `${mediaLabel} 접근 권한을 확인하지 못했습니다.`,
      );
    }
  }, [loadGrantedLibrary, mediaLabel, mediaType, permissionState]);

  useEffect(() => {
    if (!enabled || hasInitializedRef.current) {
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

      const permission = await getPostLibraryPermission(mediaType);
      setCanRequestPermission(permission.canAskAgain);

      if (permission.granted) {
        setPermissionState(getGrantedPermissionState(permission));
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
          : `${mediaLabel} 보관함을 열지 못했습니다.`,
      );
    });
  }, [enabled, loadGrantedLibrary, mediaLabel, mediaType, requestPermission]);

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
    assets,
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
