import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Eye, Heart } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionSheet, type ActionSheetItem } from "../../components/common/ActionSheet";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { StoryHeader } from "../../components/stories/StoryHeader";
import { StoryProgressBar } from "../../components/stories/StoryProgressBar";
import { StoryViewersSheet } from "../../components/stories/StoryViewersSheet";
import { createReport } from "../../features/reports/api";
import {
  deleteStory,
  getMyStoryLikedStatus,
  getStories,
  getStoryViewers,
  recordStoryView,
  toggleStoryLike,
} from "../../features/stories/api";
import type { StoryGroup, StoryViewer } from "../../features/stories/types";
import { useStableInsets } from "../../lib/useStableInsets";
import { colors } from "../../lib/theme";
import { getRelativeTimeLabel } from "../../lib/utils/time";

const STORY_DURATION_MS = 5000;
const PROGRESS_TICK_MS = 50;

export function StoryViewerScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const insets = useStableInsets();

  const [groups, setGroups] = useState<StoryGroup[] | null>(null);
  const [groupIndex, setGroupIndex] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [viewers, setViewers] = useState<StoryViewer[]>([]);
  const [isViewerSheetOpen, setIsViewerSheetOpen] = useState(false);
  const likePendingRef = useRef(false);
  const viewedIdsRef = useRef<Set<string>>(new Set());
  // 액션시트에서 삭제/신고 다이얼로그를 띄울 때는 시트가 닫혀도 재생을 재개하지 않는다.
  const keepPausedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
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

        setGroups(loadedGroups);
        setGroupIndex(startIndex >= 0 ? startIndex : 0);
        setStoryIndex(0);
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

  const currentGroup = groups?.[groupIndex] ?? null;
  const currentStory = currentGroup?.stories[storyIndex] ?? null;

  const goNext = useCallback(() => {
    if (!groups) {
      return;
    }

    const group = groups[groupIndex];

    if (group && storyIndex < group.stories.length - 1) {
      setStoryIndex((current) => current + 1);
      return;
    }

    if (groupIndex < groups.length - 1) {
      setGroupIndex((current) => current + 1);
      setStoryIndex(0);
      return;
    }

    router.back();
  }, [groupIndex, groups, router, storyIndex]);

  const goPrev = useCallback(() => {
    if (!groups) {
      return;
    }

    if (storyIndex > 0) {
      setStoryIndex((current) => current - 1);
      return;
    }

    if (groupIndex > 0) {
      const previousGroupIndex = groupIndex - 1;
      setGroupIndex(previousGroupIndex);
      setStoryIndex(groups[previousGroupIndex].stories.length - 1);
    }
  }, [groupIndex, groups, storyIndex]);

  // 스토리가 바뀔 때마다 진행바를 초기화하고, 조회 기록(내 스토리 제외)·좋아요 상태를 갱신한다.
  useEffect(() => {
    if (!currentStory) {
      return;
    }

    setProgress(0);
    setIsPortrait(false);
    setIsLiked(false);

    if (!currentStory.isMine) {
      if (!viewedIdsRef.current.has(currentStory.id)) {
        viewedIdsRef.current.add(currentStory.id);
        void recordStoryView(currentStory.id).catch(() => undefined);
      }

      void getMyStoryLikedStatus(currentStory.id)
        .then(setIsLiked)
        .catch(() => undefined);
    }
  }, [currentStory]);

  // 일시정지 상태가 아니면 진행바를 채우고, 다 차면 다음 스토리로 넘어간다.
  useEffect(() => {
    if (!currentStory || isPaused) {
      return;
    }

    const timer = setInterval(() => {
      setProgress((current) => {
        const next = current + (PROGRESS_TICK_MS / STORY_DURATION_MS) * 100;

        if (next < 100) {
          return next;
        }

        clearInterval(timer);
        goNext();
        return 100;
      });
    }, PROGRESS_TICK_MS);

    return () => {
      clearInterval(timer);
    };
  }, [currentStory, goNext, isPaused]);

  async function handleToggleLike() {
    if (!currentStory || currentStory.isMine || likePendingRef.current) {
      return;
    }

    likePendingRef.current = true;
    const previousLiked = isLiked;
    setIsLiked(!previousLiked);

    try {
      const result = await toggleStoryLike(currentStory.id);
      setIsLiked(result.liked);
    } catch {
      setIsLiked(previousLiked);
    } finally {
      likePendingRef.current = false;
    }
  }

  async function openViewerSheet() {
    if (!currentStory?.isMine) {
      return;
    }

    try {
      setIsPaused(true);
      setViewers(await getStoryViewers(currentStory.id));
      setIsViewerSheetOpen(true);
    } catch {
      setIsPaused(false);
    }
  }

  function handleConfirmDelete() {
    setIsDeleteOpen(false);

    if (!currentStory || !groups) {
      setIsPaused(false);
      return;
    }

    const storyId = currentStory.id;

    void deleteStory(storyId)
      .then(() => {
        const nextGroups = groups
          .map((group) => ({
            ...group,
            stories: group.stories.filter((story) => story.id !== storyId),
          }))
          .filter((group) => group.stories.length > 0);

        if (nextGroups.length === 0) {
          router.back();
          return;
        }

        setGroups(nextGroups);
        setGroupIndex((current) => Math.min(current, nextGroups.length - 1));
        setStoryIndex(0);
        setIsPaused(false);
      })
      .catch(() => setIsPaused(false));
  }

  async function handleConfirmReport() {
    setIsReportOpen(false);

    if (!currentStory) {
      setIsPaused(false);
      return;
    }

    try {
      await createReport({ targetId: currentStory.id, targetType: "story" });
    } catch {
      // 신고 실패는 조용히 무시하고 재생만 재개한다.
    } finally {
      setIsPaused(false);
    }
  }

  if (!groups || !currentGroup || !currentStory) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.white} />
      </View>
    );
  }

  const actionItems: ActionSheetItem[] = currentStory.isMine
    ? [
        {
          danger: true,
          label: "삭제",
          onPress: () => {
            keepPausedRef.current = true;
            setIsPaused(true);
            setIsDeleteOpen(true);
          },
        },
      ]
    : [
        {
          danger: true,
          label: "신고",
          onPress: () => {
            keepPausedRef.current = true;
            setIsPaused(true);
            setIsReportOpen(true);
          },
        },
      ];

  return (
    <View style={styles.screen}>
      <View style={[styles.frame, { marginTop: insets.top + 6 }]}>
        <Image
          blurRadius={28}
          cachePolicy="memory-disk"
          contentFit="cover"
          source={{ uri: currentStory.image_url }}
          style={styles.frameBlur}
        />
        <Image
          cachePolicy="memory-disk"
          contentFit={isPortrait ? "cover" : "contain"}
          onLoad={(event) => {
            setIsPortrait(event.source.height > event.source.width);
          }}
          source={{ uri: currentStory.image_url }}
          style={styles.frameImage}
        />
      </View>

      <LinearGradient
        colors={["rgba(0,0,0,0.5)", "transparent"]}
        pointerEvents="none"
        style={styles.scrimTop}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.5)"]}
        pointerEvents="none"
        style={styles.scrimBottom}
      />

      <Pressable
        accessibilityLabel={isPaused ? "재생" : "일시정지"}
        onPress={() => setIsPaused((current) => !current)}
        style={StyleSheet.absoluteFill}
      />
      <Pressable
        accessibilityLabel="이전 스토리"
        onPress={goPrev}
        style={[styles.tapZone, styles.tapLeft]}
      />
      <Pressable
        accessibilityLabel="다음 스토리"
        onPress={goNext}
        style={[styles.tapZone, styles.tapRight]}
      />

      <SafeAreaView edges={["top"]} style={styles.topLayer}>
        <StoryProgressBar
          count={currentGroup.stories.length}
          currentIndex={storyIndex}
          progress={progress}
        />

        <StoryHeader
          avatarUrl={currentGroup.user.avatar_url}
          isPaused={isPaused}
          nickname={currentGroup.user.nickname}
          onClose={() => router.back()}
          onMenu={() => {
            setIsPaused(true);
            setIsActionOpen(true);
          }}
          timeLabel={getRelativeTimeLabel(currentStory.created_at)}
        />
      </SafeAreaView>

      <SafeAreaView edges={["bottom"]} style={styles.bottomLayer}>
        <View style={styles.footer}>
          {currentStory.isMine ? (
            <Pressable
              accessibilityLabel="조회자 보기"
              accessibilityRole="button"
              onPress={() => {
                void openViewerSheet();
              }}
              style={styles.viewersButton}
            >
              <Eye color={colors.white} size={18} strokeWidth={2.4} />
              <Text style={styles.viewersText}>
                {currentStory.views_count}명 봄
              </Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityLabel="스토리 좋아요"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => {
                void handleToggleLike();
              }}
              style={styles.likeButton}
            >
              <Heart
                color={isLiked ? colors.danger : colors.white}
                fill={isLiked ? colors.danger : "transparent"}
                size={30}
                strokeWidth={2.4}
              />
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      <ActionSheet
        isOpen={isActionOpen}
        items={actionItems}
        onClose={() => {
          setIsActionOpen(false);
          if (keepPausedRef.current) {
            keepPausedRef.current = false;
            return;
          }
          setIsPaused(false);
        }}
      />

      <ConfirmDialog
        cancelLabel="취소"
        confirmLabel="삭제"
        danger
        description="삭제된 스토리는 복구되지 않습니다."
        isOpen={isDeleteOpen}
        onCancel={() => {
          setIsDeleteOpen(false);
          setIsPaused(false);
        }}
        onConfirm={handleConfirmDelete}
        title="스토리를 삭제할까요?"
      />

      <ConfirmDialog
        cancelLabel="취소"
        confirmLabel="신고"
        danger
        description="이 콘텐츠를 신고하시겠습니까?"
        isOpen={isReportOpen}
        onCancel={() => {
          setIsReportOpen(false);
          setIsPaused(false);
        }}
        onConfirm={() => {
          void handleConfirmReport();
        }}
        title="신고하시겠습니까?"
      />

      <StoryViewersSheet
        isOpen={isViewerSheetOpen}
        onClose={() => {
          setIsViewerSheetOpen(false);
          setIsPaused(false);
        }}
        viewers={viewers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.black,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.black,
  },
  frame: {
    width: "100%",
    aspectRatio: 9 / 16,
    maxHeight: "100%",
    overflow: "hidden",
    borderRadius: 6,
    backgroundColor: colors.black,
  },
  frameBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  frameImage: {
    ...StyleSheet.absoluteFillObject,
  },
  scrimTop: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: 150,
  },
  scrimBottom: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: 150,
  },
  tapZone: {
    position: "absolute",
    top: 96,
    bottom: 110,
    width: "30%",
  },
  tapLeft: {
    left: 0,
  },
  tapRight: {
    right: 0,
  },
  topLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    paddingHorizontal: 12,
  },
  bottomLayer: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  viewersButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.42)",
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  viewersText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  likeButton: {
    alignSelf: "flex-end",
  },
});
