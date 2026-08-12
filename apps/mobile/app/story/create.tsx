import { Redirect, useLocalSearchParams } from "expo-router";

import { useSession } from "../../src/lib/session";
import { StoryCreateScreen } from "../../src/screens/stories/StoryCreateScreen";

export default function StoryCreateRoute() {
  const { session } = useSession();
  const { sharedPostId: sharedPostIdParam } = useLocalSearchParams<{
    sharedPostId?: string | string[];
  }>();
  const sharedPostId = Array.isArray(sharedPostIdParam)
    ? sharedPostIdParam[0]
    : sharedPostIdParam;

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <StoryCreateScreen sharedPostId={sharedPostId} />;
}
