import { Redirect, useLocalSearchParams } from "expo-router";

import { useStoryCreationAccess } from "../../src/features/stories/useStoryCreationAccess";
import { useSession } from "../../src/lib/session";
import { StoryCreateScreen } from "../../src/screens/stories/StoryCreateScreen";

export default function StoryCreateRoute() {
  const { session } = useSession();
  const { canCreateStory, isStoryCreationAccessReady } =
    useStoryCreationAccess();
  const { sharedPostId: sharedPostIdParam } = useLocalSearchParams<{
    sharedPostId?: string | string[];
  }>();
  const sharedPostId = Array.isArray(sharedPostIdParam)
    ? sharedPostIdParam[0]
    : sharedPostIdParam;

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (!isStoryCreationAccessReady) {
    return null;
  }

  if (!canCreateStory) {
    return <Redirect href="/" />;
  }

  return <StoryCreateScreen sharedPostId={sharedPostId} />;
}
