import { Redirect, useLocalSearchParams } from "expo-router";

import { useSession } from "../src/lib/session";
import { ReelsScreen } from "../src/screens/feed/ReelsScreen";

export default function ReelsRoute() {
  const { session } = useSession();
  const { postId, userId } = useLocalSearchParams<{
    postId?: string | string[];
    userId?: string | string[];
  }>();
  const startPostId = Array.isArray(postId) ? postId[0] : postId;
  const authorUserId = Array.isArray(userId) ? userId[0] : userId;

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <ReelsScreen authorUserId={authorUserId} startPostId={startPostId} />
  );
}
