import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { StoryPlayer } from "../../components/stories/StoryPlayer";
import { getStories } from "../../features/stories/api";
import { getPrimedStoryViewerSession } from "../../features/stories/storyViewerSession";
import type { StoryGroup } from "../../features/stories/types";
import { colors } from "../../lib/theme";

// 라이브 스토리 진입점. 같은 학교 스토리를 불러와 시작 유저로 StoryPlayer를 띄운다.
export function StoryViewerScreen() {
  const router = useRouter();
  const { storyId: storyIdParam, userId: userIdParam } = useLocalSearchParams<{
    storyId?: string | string[];
    userId: string | string[];
  }>();
  const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
  const storyId = Array.isArray(storyIdParam) ? storyIdParam[0] : storyIdParam;
  const [data, setData] = useState<{
    groups: StoryGroup[];
    playerKey: string;
    startIndex: number;
    startStoryIndex: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        setData(null);

        if (!userId) {
          router.back();
          return;
        }

        const primed = getPrimedStoryViewerSession(userId);

        if (primed) {
          if (isMounted) {
            setData({
              ...primed,
              playerKey: `${userId}:${storyId ?? "latest"}:${primed.groups.map((group) => group.user.id).join("|")}`,
            });
          }
          return;
        }

        const loadedGroups = await getStories();

        if (!isMounted) {
          return;
        }

        if (loadedGroups.length === 0) {
          router.back();
          return;
        }

        const startIndex = loadedGroups.findIndex(
          (group) => group.user.id === userId,
        );

        if (startIndex < 0) {
          router.back();
          return;
        }

        const startGroup = loadedGroups[startIndex];
        const explicitStoryIndex = storyId
          ? startGroup.stories.findIndex((story) => story.id === storyId)
          : -1;
        const startStoryIndex =
          explicitStoryIndex >= 0
            ? explicitStoryIndex
            : Math.max(0, startGroup.stories.length - 1);

        setData({
          groups: loadedGroups,
          playerKey: `${userId}:${storyId ?? "latest"}:${loadedGroups.map((group) => group.user.id).join("|")}`,
          startIndex,
          startStoryIndex,
        });
      } catch {
        if (isMounted) {
          router.back();
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [router, storyId, userId]);

  if (!data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.white} />
      </View>
    );
  }

  return (
    <StoryPlayer
      initialGroupIndex={data.startIndex}
      initialGroups={data.groups}
      initialStoryIndex={data.startStoryIndex}
      key={data.playerKey}
      onClose={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.black,
  },
});
