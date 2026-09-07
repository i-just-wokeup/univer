import { Redirect, useLocalSearchParams } from "expo-router";

import type { PostSequenceSource } from "../src/features/feed/usePostSequence";
import { useSession } from "../src/lib/session";
import { PostSequenceScreen } from "../src/screens/post/PostSequenceScreen";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isPostSequenceSource(
  value: string | undefined,
): value is PostSequenceSource {
  return value === "explore" || value === "profile";
}

export default function PostSequenceRoute() {
  const { session } = useSession();
  const params = useLocalSearchParams<{
    nickname?: string | string[];
    postId?: string | string[];
    profileUserId?: string | string[];
    source?: string | string[];
  }>();
  const postId = getParam(params.postId);
  const profileUserId = getParam(params.profileUserId);
  const source = getParam(params.source);

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (!postId || !isPostSequenceSource(source)) {
    return <Redirect href="/" />;
  }

  if (source === "profile" && !profileUserId) {
    return <Redirect href="/profile" />;
  }

  return (
    <PostSequenceScreen
      postId={postId}
      profileUserId={profileUserId}
      source={source}
    />
  );
}
