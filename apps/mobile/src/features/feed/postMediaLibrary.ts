import * as MediaLibrary from "expo-media-library";

export type PostLibraryAlbum = {
  assetCount: number;
  coverPhoto: PostLibraryPhoto;
  id: string;
  title: string;
};

export type PostLibraryAlbumOption = {
  assetCount: number;
  coverPhoto: PostLibraryPhoto;
  id: string | null;
  title: string;
};

export type PostLibraryPhoto = {
  height: number;
  id: string;
  uri: string;
  width: number;
};

export type PostLibraryPermission = Pick<
  MediaLibrary.PermissionResponse,
  "canAskAgain" | "granted" | "status"
>;

export type PostLibraryPhotoPage = {
  endCursor: string;
  hasNextPage: boolean;
  photos: PostLibraryPhoto[];
  totalCount: number;
};

type GetPostLibraryPhotoPageParams = {
  after?: string;
  albumId: string | null;
  first: number;
};

function toLibraryPhoto(asset: MediaLibrary.Asset): PostLibraryPhoto {
  return {
    height: asset.height,
    id: asset.id,
    uri: asset.uri,
    width: asset.width,
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

export async function getPostLibraryAlbums(): Promise<PostLibraryAlbum[]> {
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
        const page = await getPostLibraryPhotoPage({
          albumId: album.id,
          first: 1,
        });
        const coverPhoto = page.photos[0];
        if (!coverPhoto) {
          return null;
        }

        return {
          assetCount: page.totalCount,
          coverPhoto,
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

export async function getPostLibraryPhotoPage({
  after,
  albumId,
  first,
}: GetPostLibraryPhotoPageParams): Promise<PostLibraryPhotoPage> {
  const page = await MediaLibrary.getAssetsAsync({
    after,
    album: albumId ?? undefined,
    first,
    mediaType: MediaLibrary.MediaType.photo,
    resolveWithFullInfo: false,
    sortBy: [[MediaLibrary.SortBy.creationTime, false]],
  });

  return {
    endCursor: page.endCursor,
    hasNextPage: page.hasNextPage,
    photos: page.assets.map(toLibraryPhoto),
    totalCount: page.totalCount,
  };
}

export function getPostLibraryPermission(): Promise<PostLibraryPermission> {
  return MediaLibrary.getPermissionsAsync(false, ["photo"]);
}

export function isPostLibraryAvailable(): Promise<boolean> {
  return MediaLibrary.isAvailableAsync();
}

export function requestPostLibraryPermission(): Promise<PostLibraryPermission> {
  return MediaLibrary.requestPermissionsAsync(false, ["photo"]);
}

export async function resolvePostLibraryPhotoUris(
  photos: PostLibraryPhoto[],
): Promise<string[]> {
  // Android Asset URI는 이미 로컬 file:// 경로다. 전체 EXIF 조회는
  // ACCESS_MEDIA_LOCATION을 요구하므로 iOS의 ph:// 해석에만 사용한다.
  if (process.env.EXPO_OS === "android") {
    return photos.map((photo) => photo.uri);
  }

  return Promise.all(
    photos.map(async (photo) => {
      const info = await MediaLibrary.getAssetInfoAsync(photo.id, {
        shouldDownloadFromNetwork: true,
      });
      return info.localUri ?? info.uri ?? photo.uri;
    }),
  );
}
