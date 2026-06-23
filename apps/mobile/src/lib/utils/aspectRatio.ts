import type { PostAspectRatio } from "../../features/feed/types";

export function getAspectRatioValue(aspectRatio: PostAspectRatio): number {
  if (aspectRatio === "landscape") {
    return 16 / 9;
  }

  if (aspectRatio === "portrait") {
    return 4 / 5;
  }

  return 1;
}
