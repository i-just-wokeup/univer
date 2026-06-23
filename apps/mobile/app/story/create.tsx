import { Redirect } from "expo-router";

import { useSession } from "../../src/lib/session";
import { StoryCreateScreen } from "../../src/screens/stories/StoryCreateScreen";

export default function StoryCreateRoute() {
  const { session } = useSession();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <StoryCreateScreen />;
}
