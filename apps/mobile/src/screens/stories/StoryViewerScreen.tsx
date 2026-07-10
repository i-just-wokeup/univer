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
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [data, setData] = useState<{
    groups: StoryGroup[];
    playerKey: string;
    startIndex: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        setData(null);
        const primed = getPrimedStoryViewerSession(userId);

        if (primed) {
          if (isMounted) {
            setData({
              ...primed,
              playerKey: `${userId}:${primed.groups.map((group) => group.user.id).join("|")}`,
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

        setData({
          groups: loadedGroups,
          playerKey: `${userId}:${loadedGroups.map((group) => group.user.id).join("|")}`,
          startIndex: startIndex >= 0 ? startIndex : 0,
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
  }, [router, userId]);

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
