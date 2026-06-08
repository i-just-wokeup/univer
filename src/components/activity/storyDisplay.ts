import type { ActivityStory } from "@/features/activity/api";

export function getStoryStatus(story: ActivityStory) {
  return new Date(story.expires_at).getTime() > Date.now() ? "활성" : "만료됨";
}

export function getVisibilityLabel(visibility: ActivityStory["visibility"]) {
  return visibility === "close_friends" ? "크루공개" : "전체공개";
}
