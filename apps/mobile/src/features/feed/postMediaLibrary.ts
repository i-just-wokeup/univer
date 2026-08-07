import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";

export const MAX_POST_VIDEO_DURATION_SECONDS = 60;
export const MAX_POST_VIDEO_SIZE_BYTES = 250 * 1024 * 1024;

export type PostLibraryMediaType = "photo" | "video";

type PostLibraryAssetBase = {
  height: number;
  id: string;
  uri: string;
  width: number;
};

export type PostLibraryPhoto = PostLibraryAssetBase & {
  mediaType: "photo";
};

export type PostLibraryVideo = PostLibraryAssetBase & {
  durationSeconds: number;
  mediaType: "video";
};

export type PreparedPostLibraryVideo = PostLibraryVideo & {
  uri: string;
};

export type PostLibraryAsset = PostLibraryPhoto | PostLibraryVideo;

export type PostLibraryAlbum = {
  assetCount: number;
  coverAsset: PostLibraryAsset;
  id: string;
  title: string;
};

export type PostLibraryAlbumOption = {
  assetCount: number;
  coverAsset: PostLibraryAsset;
  id: string | null;
  title: string;
};

export type PostLibraryPermission = Pick<
  MediaLibrary.PermissionResponse,
  "accessPrivileges" | "canAskAgain" | "granted" | "status"
>;

export type PostLibraryAssetPage = {
  assets: PostLibraryAsset[];
  endCursor: string;
  hasNextPage: boolean;
  totalCount: number;
};

const resolvedAssetUriCache = new Map<string, string>();
const pendingAssetUriRequests = new Map<string, Promise<string>>();
const POST_VIDEO_CACHE_DIRECTORY = `${FileSystem.cacheDirectory ?? ""}PostMediaLibrary/`;

type GetPostLibraryAssetPageParams = {
  after?: string;
  albumId: string | null;
  first: number;
  mediaType: PostLibraryMediaType;
};

function toLibraryAsset(asset: MediaLibrary.Asset): PostLibraryAsset {
  const base = {
    height: asset.height,
    id: asset.id,
    uri: asset.uri,
    width: asset.width,
  };

  if (asset.mediaType === MediaLibrary.MediaType.video) {
    return {
      ...base,
      durationSeconds: asset.duration,
      mediaType: "video",
    };
  }

  return {
    ...base,
    mediaType: "photo",
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      const item = items[currentIndex];
      if (item !== undefined) {
        results[currentIndex] = await mapper(item);
      }
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

export async function getPostLibraryAlbums(
  mediaType: PostLibraryMediaType,
): Promise<PostLibraryAlbum[]> {
  const albums = await MediaLibrary.getAlbumsAsync({
    includeSmartAlbums: true,
  });
  const uniqueAlbums = new Map<string, MediaLibrary.Album>();

  for (const album of albums) {
    if (album.assetCount <= 0 || uniqueAlbums.has(album.id)) {
      continue;
    }

    uniqueAlbums.set(album.id, album);
  }

  const albumsWithCovers = await mapWithConcurrency(
    Array.from(uniqueAlbums.values()),
    4,
    async (album): Promise<PostLibraryAlbum | null> => {
      try {
        const page = await getPostLibraryAssetPage({
          albumId: album.id,
          first: 1,
          mediaType,
        });
        const coverAsset = page.assets[0];
        if (!coverAsset) {
          return null;
        }

        return {
          assetCount: page.totalCount,
          coverAsset,
          id: album.id,
          title: album.title.trim() || "이름 없는 앨범",
        };
      } catch {
        return null;
      }
    },
  );

  return albumsWithCovers.filter(
    (album): album is PostLibraryAlbum => album !== null,
  );
}

export async function getPostLibraryAssetPage({
  after,
  albumId,
  first,
  mediaType,
}: GetPostLibraryAssetPageParams): Promise<PostLibraryAssetPage> {
  const page = await MediaLibrary.getAssetsAsync({
    after,
    album: albumId ?? undefined,
    first,
    mediaType: MediaLibrary.MediaType[mediaType],
    resolveWithFullInfo: false,
    sortBy: [[MediaLibrary.SortBy.creationTime, false]],
  });

  return {
    assets: page.assets.map(toLibraryAsset),
    endCursor: page.endCursor,
    hasNextPage: page.hasNextPage,
    totalCount: page.totalCount,
  };
}

export function getPostLibraryPermission(
  mediaType: PostLibraryMediaType,
): Promise<PostLibraryPermission> {
  return MediaLibrary.getPermissionsAsync(false, [mediaType]);
}

export function isPostLibraryAvailable(): Promise<boolean> {
  return MediaLibrary.isAvailableAsync();
}

export function requestPostLibraryPermission(
  mediaType: PostLibraryMediaType,
): Promise<PostLibraryPermission> {
  return MediaLibrary.requestPermissionsAsync(false, [mediaType]);
}

export async function updatePostLibraryPermissionSelection(
  mediaType: PostLibraryMediaType,
): Promise<PostLibraryPermission> {
  await MediaLibrary.presentPermissionsPickerAsync([mediaType]);
  return getPostLibraryPermission(mediaType);
}

async function resolvePostLibraryAssetUriUncached(
  asset: PostLibraryAsset,
): Promise<string> {
  // Android Asset URI는 이미 로컬 file:// 경로다. 전체 메타데이터 조회는
  // ACCESS_MEDIA_LOCATION을 요구할 수 있으므로 iOS의 ph:// 해석에만 사용한다.
  if (process.env.EXPO_OS === "android") {
    return asset.uri;
  }

  const info = await MediaLibrary.getAssetInfoAsync(asset.id, {
    shouldDownloadFromNetwork: true,
  });

  if (asset.mediaType === "video") {
    if (!FileSystem.cacheDirectory) {
      throw new Error("영상 임시 저장 공간을 사용할 수 없습니다.");
    }

    const extensionMatch = info.filename.match(/\.([a-zA-Z0-9]{1,8})$/);
    const extension = extensionMatch?.[1]?.toLowerCase() ?? "mov";
    const cacheFileName = `${asset.id.replace(/[^a-zA-Z0-9_-]/g, "_")}.${extension}`;
    const cachedVideoUri = `${POST_VIDEO_CACHE_DIRECTORY}${cacheFileName}`;
    const cachedVideoInfo = await FileSystem.getInfoAsync(cachedVideoUri);

    if (!cachedVideoInfo.exists) {
      await FileSystem.makeDirectoryAsync(POST_VIDEO_CACHE_DIRECTORY, {
        intermediates: true,
      });
      await FileSystem.copyAsync({
        from: asset.uri,
        to: cachedVideoUri,
      });
    }

    return cachedVideoUri;
  }

  const resolvedUri = info.localUri ?? info.uri ?? asset.uri;

  return resolvedUri.startsWith("/") ? `file://${resolvedUri}` : resolvedUri;
}

export async function resolvePostLibraryAssetUri(
  asset: PostLibraryAsset,
): Promise<string> {
  const cacheKey = `${asset.mediaType}:${asset.id}`;
  const cachedUri = resolvedAssetUriCache.get(cacheKey);
  if (cachedUri) {
    return cachedUri;
  }

  const pendingRequest = pendingAssetUriRequests.get(cacheKey);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = resolvePostLibraryAssetUriUncached(asset)
    .then((uri) => {
      resolvedAssetUriCache.set(cacheKey, uri);
      return uri;
    })
    .finally(() => {
      pendingAssetUriRequests.delete(cacheKey);
    });

  pendingAssetUriRequests.set(cacheKey, request);
  return request;
}

export async function resolvePostLibraryPhotoUris(
  photos: PostLibraryPhoto[],
): Promise<string[]> {
  return Promise.all(photos.map(resolvePostLibraryAssetUri));
}

export async function preparePostLibraryVideo(
  video: PostLibraryVideo,
): Promise<PreparedPostLibraryVideo> {
  if (video.durationSeconds > MAX_POST_VIDEO_DURATION_SECONDS) {
    throw new Error(
      `${MAX_POST_VIDEO_DURATION_SECONDS}초 이하 영상만 올릴 수 있어요.`,
    );
  }

  const uri = await resolvePostLibraryAssetUri(video);

  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && info.size > MAX_POST_VIDEO_SIZE_BYTES) {
      throw new Error("영상 용량이 너무 커요. (250MB 이하)");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("250MB")) {
      throw error;
    }
    // 파일 크기를 읽지 못하면 업로드 단계의 제한에 맡긴다.
  }

  return { ...video, uri };
}
