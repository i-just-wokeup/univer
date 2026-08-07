import { Image } from "expo-image";
import { Platform, type ImageStyle, type StyleProp } from "react-native";

import type { PostLibraryAsset } from "../../features/feed/postMediaLibrary";
import { usePostLibraryVideoThumbnail } from "../../features/feed/usePostLibraryVideoThumbnail";

type PostLibraryAssetThumbnailProps = {
  asset: PostLibraryAsset;
  enabled?: boolean;
  style: StyleProp<ImageStyle>;
};

export function PostLibraryAssetThumbnail({
  asset,
  enabled = true,
  style,
}: PostLibraryAssetThumbnailProps) {
  const video = asset.mediaType === "video" ? asset : null;
  const videoThumbnail = usePostLibraryVideoThumbnail(
    video,
    enabled && Platform.OS === "android",
  );
  const source =
    asset.mediaType === "photo"
      ? { uri: asset.uri }
      : Platform.OS === "ios"
        ? { uri: asset.uri }
        : videoThumbnail
        ? { uri: videoThumbnail }
        : null;

  if (!source) {
    return null;
  }

  return (
    <Image
      allowDownscaling
      cachePolicy="memory-disk"
      contentFit="cover"
      recyclingKey={`${asset.mediaType}:${asset.id}`}
      source={source}
      style={style}
      transition={80}
    />
  );
}
