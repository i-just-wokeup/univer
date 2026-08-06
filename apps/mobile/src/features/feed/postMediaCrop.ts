import { manipulateAsync } from "expo-image-manipulator";

import { getAspectRatioValue } from "../../lib/utils/aspectRatio";
import type { PostLibraryPhoto } from "./postMediaLibrary";
import type { PostAspectRatio } from "./types";

export const MAX_POST_MEDIA_CROP_SCALE = 4;

export type PostMediaCropTransform = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

export type PostMediaCropTransforms = Record<
  string,
  PostMediaCropTransform
>;

export type PostMediaCropRect = {
  height: number;
  originX: number;
  originY: number;
  width: number;
};

export const DEFAULT_POST_MEDIA_CROP_TRANSFORM: PostMediaCropTransform = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function normalizePostMediaCropTransform(
  transform: PostMediaCropTransform,
): PostMediaCropTransform {
  return {
    offsetX: clamp(transform.offsetX, -1, 1),
    offsetY: clamp(transform.offsetY, -1, 1),
    scale: clamp(transform.scale, 1, MAX_POST_MEDIA_CROP_SCALE),
  };
}

export function getPostMediaCropRect(
  photo: Pick<PostLibraryPhoto, "height" | "width">,
  aspectRatio: PostAspectRatio,
  cropTransform: PostMediaCropTransform,
): PostMediaCropRect {
  const transform = normalizePostMediaCropTransform(cropTransform);
  const targetRatio = getAspectRatioValue(aspectRatio);
  const sourceRatio = photo.width / photo.height;
  const baseCropWidth =
    sourceRatio > targetRatio ? photo.height * targetRatio : photo.width;
  const baseCropHeight =
    sourceRatio > targetRatio ? photo.height : photo.width / targetRatio;
  const cropWidth = Math.max(1, Math.round(baseCropWidth / transform.scale));
  const cropHeight = Math.max(1, Math.round(baseCropHeight / transform.scale));
  const availableX = Math.max(0, (photo.width - cropWidth) / 2);
  const availableY = Math.max(0, (photo.height - cropHeight) / 2);
  const rawOriginX =
    photo.width / 2 - transform.offsetX * availableX - cropWidth / 2;
  const rawOriginY =
    photo.height / 2 - transform.offsetY * availableY - cropHeight / 2;

  return {
    height: Math.min(cropHeight, photo.height),
    originX: Math.round(clamp(rawOriginX, 0, photo.width - cropWidth)),
    originY: Math.round(clamp(rawOriginY, 0, photo.height - cropHeight)),
    width: Math.min(cropWidth, photo.width),
  };
}

function isFullPhotoCrop(
  photo: PostLibraryPhoto,
  crop: PostMediaCropRect,
): boolean {
  return (
    crop.originX === 0 &&
    crop.originY === 0 &&
    crop.width === photo.width &&
    crop.height === photo.height
  );
}

export async function cropPostLibraryPhotos(
  photos: PostLibraryPhoto[],
  sourceUris: string[],
  aspectRatio: PostAspectRatio,
  cropTransforms: PostMediaCropTransforms,
): Promise<string[]> {
  const croppedUris: string[] = [];

  // 고해상도 사진 여러 장을 동시에 디코딩하면 메모리가 급증하므로 순차 처리한다.
  for (const [index, photo] of photos.entries()) {
    const sourceUri = sourceUris[index];
    if (!sourceUri) {
      throw new Error("선택한 사진 경로를 확인하지 못했습니다.");
    }

    const crop = getPostMediaCropRect(
      photo,
      aspectRatio,
      cropTransforms[photo.id] ?? DEFAULT_POST_MEDIA_CROP_TRANSFORM,
    );
    if (isFullPhotoCrop(photo, crop)) {
      croppedUris.push(sourceUri);
      continue;
    }

    const result = await manipulateAsync(sourceUri, [{ crop }]);
    croppedUris.push(result.uri);
  }

  return croppedUris;
}
