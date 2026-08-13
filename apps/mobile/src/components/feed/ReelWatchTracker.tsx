import type { VideoPlayer } from "expo-video";

import { useReelWatch } from "../../features/metrics/useReelWatch";

type ReelWatchTrackerProps = {
  isActive: boolean;
  ownerId: string;
  player: VideoPlayer;
  postId: string;
};

// timeUpdate 구독을 ReelItem 렌더 트리에서 격리하는 headless 추적기.
export function ReelWatchTracker(props: ReelWatchTrackerProps) {
  useReelWatch(props);
  return null;
}
