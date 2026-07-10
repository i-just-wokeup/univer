import { useRouter } from "expo-router";
import { useCallback } from "react";

import { primeStoryViewerSession } from "../../features/stories/storyViewerSession";
import type { StoryGroup } from "../../features/stories/types";

type UseHomeNavigationParams = {
  closeComments: () => void;
};

export function useHomeNavigation({ closeComments }: UseHomeNavigationParams) {
  const router = useRouter();

  const handleUserPress = useCallback(
    (nickname: string) => {
      router.push({
        pathname: "/profile/[nickname]",
        params: { nickname },
      });
    },
    [router],
  );

  const handleCommentUserPress = useCallback(
    (nickname: string) => {
      closeComments();
      handleUserPress(nickname);
    },
    [closeComments, handleUserPress],
  );

  const handlePressCreateStory = useCallback(() => {
    router.push("/story/create");
  }, [router]);

  const handlePressNotifications = useCallback(() => {
    router.push("/notifications");
  }, [router]);

  const handlePressMessages = useCallback(() => {
    router.push("/messages");
  }, [router]);

  const handlePressStoryGroup = useCallback(
    (group: StoryGroup, groups: StoryGroup[]) => {
      primeStoryViewerSession(groups, group.user.id);
      router.push({
        pathname: "/story/[userId]",
        params: { userId: group.user.id },
      });
    },
    [router],
  );

  const handleVideoPress = useCallback(
    (postId: string) => {
      router.push({ pathname: "/reels", params: { postId } });
    },
    [router],
  );

  return {
    handleCommentUserPress,
    handlePressCreateStory,
    handlePressMessages,
    handlePressNotifications,
    handlePressStoryGroup,
    handleUserPress,
    handleVideoPress,
  };
}
