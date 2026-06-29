import { Redirect, useLocalSearchParams } from "expo-router";

import { useSession } from "../src/lib/session";
import { ReelsScreen } from "../src/screens/feed/ReelsScreen";

export default function ReelsRoute() {
  const { session } = useSession();
  const { postId } = useLocalSearchParams<{ postId?: string | string[] }>();
  const startPostId = Array.isArray(postId) ? postId[0] : postId;

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <ReelsScreen startPostId={startPostId} />;
}
