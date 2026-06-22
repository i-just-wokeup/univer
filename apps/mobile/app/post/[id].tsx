import { Redirect, useLocalSearchParams } from "expo-router";

import { useSession } from "../../src/lib/session";
import { PostDetailScreen } from "../../src/screens/post/PostDetailScreen";

export default function PostDetailRoute() {
  const { session } = useSession();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const postId = Array.isArray(id) ? id[0] : id;

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (!postId) {
    return <Redirect href="/" />;
  }

  return <PostDetailScreen postId={postId} />;
}
