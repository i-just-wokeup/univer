import { Redirect, useLocalSearchParams } from "expo-router";

import { useSession } from "../../../src/lib/session";
import { PostInsightScreen } from "../../../src/screens/insights/PostInsightScreen";

export default function PostInsightRoute() {
  const { session } = useSession();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const postId = Array.isArray(id) ? id[0] : id;

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (!postId) {
    return <Redirect href="/insights" />;
  }

  return <PostInsightScreen postId={postId} />;
}
