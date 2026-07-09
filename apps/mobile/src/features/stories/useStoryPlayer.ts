import { useCallback, useEffect, useRef, useState } from "react";

import { createReport } from "../reports/api";
import {
  deleteStory,
  getMyStoryLikedStatus,
  getStoryViewers,
  recordStoryView,
  toggleStoryLike,
} from "./api";
import type { StoryGroup, StoryViewer } from "./types";

const STORY_DURATION_MS = 5000;
const PROGRESS_TICK_MS = 50;

type UseStoryPlayerParams = {
  initialGroupIndex: number;
  initialGroups: StoryGroup[];
  onClose: () => void;
};

// 스토리 재생 로직(진행/이동/조회기록/좋아요/삭제/신고 + 일시정지 조율). UI는 컴포넌트가 담당.
export function useStoryPlayer({
  initialGroupIndex,
  initialGroups,
  onClose,
}: UseStoryPlayerParams) {
  const [groups, setGroups] = useState<StoryGroup[]>(initialGroups);
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [viewers, setViewers] = useState<StoryViewer[]>([]);
  const [isViewerSheetOpen, setIsViewerSheetOpen] = useState(false);
  const likePendingRef = useRef(false);
  const progressRef = useRef(0);
  const viewedIdsRef = useRef<Set<string>>(new Set());
  // 액션시트에서 삭제/신고 다이얼로그를 띄울 때는 시트가 닫혀도 재생을 재개하지 않는다.
  const keepPausedRef = useRef(false);

  const currentGroup = groups[groupIndex] ?? null;
  const currentStory = currentGroup?.stories[storyIndex] ?? null;

  // 라우트가 재사용되거나 홈 스토리바 세션이 새로 들어오면 이전 재생 위치를 버리고 새 시작점으로 맞춘다.
  useEffect(() => {
    setGroups(initialGroups);
    setGroupIndex(initialGroupIndex);
    setStoryIndex(0);
    setProgress(0);
    setIsLiked(false);
    setIsPaused(false);
    setIsActionOpen(false);
    setIsDeleteOpen(false);
    setIsReportOpen(false);
    setIsViewerSheetOpen(false);
    setViewers([]);
    progressRef.current = 0;
    viewedIdsRef.current.clear();
    keepPausedRef.current = false;
  }, [initialGroupIndex, initialGroups]);

  const goNext = useCallback(() => {
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

    onClose();
  }, [groupIndex, groups, onClose, storyIndex]);

  const goPrev = useCallback(() => {
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
    progressRef.current = 0;
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

  // 사진은 5초 타이머로 진행바를 채운다. 영상은 StoryVideoView가 재생 위치로 진행/종료를 구동하므로 제외.
  useEffect(() => {
    if (!currentStory || isPaused || currentStory.mediaType === "video") {
      return;
    }

    const timer = setInterval(() => {
      const next =
        progressRef.current + (PROGRESS_TICK_MS / STORY_DURATION_MS) * 100;

      if (next < 100) {
        progressRef.current = next;
        setProgress(next);
        return;
      }

      progressRef.current = 100;
      setProgress(100);
      clearInterval(timer);
      goNext();
    }, PROGRESS_TICK_MS);

    return () => {
      clearInterval(timer);
    };
  }, [currentStory, goNext, isPaused]);

  function togglePause() {
    setIsPaused((current) => !current);
  }

  // 영상 재생 위치(0~100)를 진행바에 반영. StoryVideoView가 호출한다.
  function setVideoProgress(percent: number) {
    progressRef.current = percent;
    setProgress(percent);
  }

  async function toggleLike() {
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

  function openMenu() {
    setIsPaused(true);
    setIsActionOpen(true);
  }

  function closeMenu() {
    setIsActionOpen(false);

    if (keepPausedRef.current) {
      keepPausedRef.current = false;
      return;
    }

    setIsPaused(false);
  }

  function requestDelete() {
    keepPausedRef.current = true;
    setIsPaused(true);
    setIsDeleteOpen(true);
  }

  function requestReport() {
    keepPausedRef.current = true;
    setIsPaused(true);
    setIsReportOpen(true);
  }

  function cancelDelete() {
    setIsDeleteOpen(false);
    setIsPaused(false);
  }

  function cancelReport() {
    setIsReportOpen(false);
    setIsPaused(false);
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

  function closeViewerSheet() {
    setIsViewerSheetOpen(false);
    setIsPaused(false);
  }

  function confirmDelete() {
    setIsDeleteOpen(false);

    if (!currentStory) {
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
          onClose();
          return;
        }

        setGroups(nextGroups);
        setGroupIndex((current) => Math.min(current, nextGroups.length - 1));
        setStoryIndex(0);
        setIsPaused(false);
      })
      .catch(() => setIsPaused(false));
  }

  async function confirmReport() {
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

  return {
    cancelDelete,
    cancelReport,
    closeMenu,
    closeViewerSheet,
    confirmDelete,
    confirmReport,
    currentGroup,
    currentStory,
    goNext,
    goPrev,
    isActionOpen,
    isDeleteOpen,
    isLiked,
    isPaused,
    isReportOpen,
    isViewerSheetOpen,
    openMenu,
    openViewerSheet,
    progress,
    requestDelete,
    requestReport,
    setVideoProgress,
    storyIndex,
    toggleLike,
    togglePause,
    viewers,
  };
}
