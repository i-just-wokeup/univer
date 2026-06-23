import { Redirect, useLocalSearchParams } from "expo-router";

import { useSession } from "../../src/lib/session";
import { StoryViewerScreen } from "../../src/screens/stories/StoryViewerScreen";

export default function StoryViewerRoute() {
  const { session } = useSession();
  const { userId } = useLocalSearchParams<{ userId?: string | string[] }>();
  const startUserId = Array.isArray(userId) ? userId[0] : userId;

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (!startUserId) {
    return <Redirect href="/" />;
  }

  return <StoryViewerScreen />;
}
