import type { PostAspectRatio } from "@/features/feed/api";

export const POST_ASPECT_RATIO_OPTIONS: Array<{
  description: string;
  label: string;
  value: PostAspectRatio;
}> = [
  {
    description: "1:1",
    label: "정사각형",
    value: "square",
  },
  {
    description: "4:5",
    label: "세로",
    value: "portrait",
  },
  {
    description: "16:9",
    label: "가로",
    value: "landscape",
  },
];

export function getPostAspectRatioClass(aspectRatio: PostAspectRatio) {
  switch (aspectRatio) {
    case "square":
      return "aspect-square";
    case "landscape":
      return "aspect-video";
    case "portrait":
    default:
      return "aspect-[4/5]";
  }
}
