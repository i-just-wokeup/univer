"use client";

import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ActionSheet, type ActionSheetItem } from "@/components/common/ActionSheet";
import { Avatar } from "@/components/common/Avatar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Toast } from "@/components/common/Toast";
import { createReport } from "@/features/reports/api";
import {
  deleteStory,
  getMyStoryLikedStatus,
  getStoryPreview,
  getStoryViewers,
  getUserStories,
  recordStoryView,
  toggleStoryLike,
  type Story,
  type StoryPreview,
  type Viewer,
} from "@/features/stories/api";

const STORY_DURATION_MS = 5000;
const PROGRESS_TICK_MS = 50;
const FEED_REFRESH_URL = "/?refreshStories=1";

type ToastState = {
  isVisible: boolean;
  message: string;
  type: "success" | "error";
};

function formatRelativeTime(dateText: string) {
  const diffMs = new Date(dateText).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const formatter = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  return formatter.format(Math.round(diffHours / 24), "day");
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M8 5h3v14H8V5Zm5 0h3v14h-3V5Z" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill={filled ? "#ef4444" : "none"}
      aria-hidden="true"
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
        stroke={filled ? "#ef4444" : "white"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ViewerSheet({
  isOpen,
  onClose,
  onViewerClick,
  viewers,
}: {
  isOpen: boolean;
  onClose: () => void;
  onViewerClick: (viewer: Viewer) => void;
  viewers: Viewer[];
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={onClose}>
      <div
        className="max-h-[70vh] w-full rounded-t-[2rem] bg-white px-5 pb-6 pt-4 text-zinc-950"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-300" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">조회자 {viewers.length}명</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500"
            aria-label="조회자 목록 닫기"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="max-h-[52vh] overflow-y-auto">
          {viewers.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              아직 조회한 사람이 없습니다
            </p>
          ) : (
            <ul className="space-y-3">
              {viewers.map((viewer) => (
                <li key={viewer.id}>
                  <button
                    type="button"
                    onClick={() => onViewerClick(viewer)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl py-1 text-left transition hover:bg-zinc-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        src={viewer.avatar_url}
                        nickname={viewer.nickname}
                        size="md"
                      />
                      <span className="truncate text-sm font-semibold">
                        {viewer.nickname}
                      </span>
                    </div>
                    <span className={viewer.isLiked ? "text-red-500" : "text-zinc-300"}>
                      <HeartIcon filled={viewer.isLiked} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function UserPreviewCard({
  onClick,
  preview,
}: {
  onClick: () => void;
  preview: StoryPreview;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative hidden h-56 w-32 shrink-0 overflow-hidden rounded-xl bg-zinc-900 text-left opacity-70 transition hover:opacity-100 sm:block"
      aria-label={`${preview.user.nickname} 스토리 보기`}
    >
      <Image
        src={preview.imageUrl}
        alt=""
        aria-hidden="true"
        fill
        sizes="128px"
        className="object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar
            src={preview.user.avatar_url}
            nickname={preview.user.nickname}
            size="xs"
          />
          <span className="min-w-0 truncate text-xs font-bold text-white">
            {preview.user.nickname}
          </span>
        </div>
      </div>
    </button>
  );
}

function StoryTopOverlay({
  currentIndex,
  currentStory,
  isPaused,
  onOpenActions,
  onOpenProfile,
  progress,
  stories,
}: {
  currentIndex: number;
  currentStory: Story;
  isPaused: boolean;
  onOpenActions: () => void;
  onOpenProfile: () => void;
  progress: number;
  stories: Story[];
}) {
  return (
    <header className="absolute left-0 right-0 top-0 z-20 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] sm:pt-4">
      <div className="mb-4 flex gap-1">
        {stories.map((story, index) => (
          <div
            key={story.id}
            className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/30"
          >
            <div
              className="h-full rounded-full bg-white transition-[width] duration-75"
              style={{
                width:
                  index < currentIndex
                    ? "100%"
                    : index === currentIndex
                      ? `${progress}%`
                      : "0%",
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex min-w-0 items-center gap-3"
          aria-label={`${currentStory.user.nickname} 프로필 보기`}
        >
          <Avatar
            src={currentStory.user.avatar_url}
            nickname={currentStory.user.nickname}
            size="sm"
          />
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-bold">
              {currentStory.user.nickname}
            </p>
            <p className="text-xs text-white/70">
              {formatRelativeTime(currentStory.created_at)}
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-3">
          {isPaused ? (
            <span className="text-white" aria-label="스토리 일시정지됨">
              <PauseIcon />
            </span>
          ) : null}
          <button
            type="button"
            onClick={onOpenActions}
            className="text-white"
            aria-label="스토리 메뉴 열기"
          >
            <MoreIcon />
          </button>
        </div>
      </div>
    </header>
  );
}

function StoryBottomActions({
  className = "",
  currentStory,
  isLikeLoading,
  isStoryLiked,
  onLike,
  onOpenViewers,
}: {
  className?: string;
  currentStory: Story;
  isLikeLoading: boolean;
  isStoryLiked: boolean;
  onLike: () => void;
  onOpenViewers: () => void;
}) {
  if (currentStory.isMine) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={onOpenViewers}
          className="inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-sm font-bold text-white backdrop-blur"
        >
          <EyeIcon />
          <span>{currentStory.views_count}명 봄</span>
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onLike}
        disabled={isLikeLoading}
        className={`p-2 transition disabled:opacity-60 ${
          isStoryLiked ? "text-red-500" : "text-white"
        }`}
        aria-label={isStoryLiked ? "스토리 좋아요 취소" : "스토리 좋아요"}
      >
        <span className="[&>svg]:h-7 [&>svg]:w-7">
          <HeartIcon filled={isStoryLiked} />
        </span>
      </button>
    </div>
  );
}

export default function StoryViewerPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewedStoryIdsRef = useRef<Set<string>>(new Set());
  const keepPausedAfterActionSheetCloseRef = useRef(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isStoryLiked, setIsStoryLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [isViewerSheetOpen, setIsViewerSheetOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isReportConfirmOpen, setIsReportConfirmOpen] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [prevUserPreview, setPrevUserPreview] =
    useState<StoryPreview | null>(null);
  const [nextUserPreview, setNextUserPreview] =
    useState<StoryPreview | null>(null);
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: "",
    type: "success",
  });

  const currentStory = stories[currentIndex] ?? null;
  const usersParam = searchParams.get("users");
  const parsedUserIds = usersParam ? usersParam.split(",").filter(Boolean) : [];
  const orderedUserIds = parsedUserIds.includes(params.userId)
    ? parsedUserIds
    : [params.userId];
  const currentUserIndex = orderedUserIds.indexOf(params.userId);
  const prevUserId =
    currentUserIndex > 0 ? orderedUserIds[currentUserIndex - 1] : null;
  const nextUserId =
    currentUserIndex < orderedUserIds.length - 1
      ? orderedUserIds[currentUserIndex + 1]
      : null;
  const orderedUsersQuery = orderedUserIds.join(",");

  useEffect(() => {
    let isMounted = true;

    async function loadStories() {
      try {
        setIsLoading(true);
        setError(null);

        const loadedStories = await getUserStories(params.userId);

        if (!isMounted) {
          return;
        }

        setStories(loadedStories);
        setCurrentIndex(0);

        if (loadedStories.length === 0) {
          setError("볼 수 있는 스토리가 없습니다.");
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "스토리를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStories();

    return () => {
      isMounted = false;
    };
  }, [params.userId]);

  useEffect(() => {
    if (!currentStory || currentStory.isMine) {
      return;
    }

    if (viewedStoryIdsRef.current.has(currentStory.id)) {
      return;
    }

    viewedStoryIdsRef.current.add(currentStory.id);
    void recordStoryView(currentStory.id).catch((viewError) => {
      console.error("스토리 조회 기록 실패", viewError);
    });
  }, [currentStory]);

  useEffect(() => {
    let isMounted = true;

    async function loadLikeStatus() {
      if (!currentStory || currentStory.isMine) {
        await Promise.resolve();

        if (isMounted) {
          setIsStoryLiked(false);
        }

        return;
      }

      try {
        const likedStatus = await getMyStoryLikedStatus(currentStory.id);

        if (isMounted) {
          setIsStoryLiked(likedStatus);
        }
      } catch (likeStatusError) {
        console.error("스토리 좋아요 상태 조회 실패", likeStatusError);
      }
    }

    void loadLikeStatus();

    return () => {
      isMounted = false;
    };
  }, [currentStory]);

  useEffect(() => {
    if (!currentStory) {
      return;
    }

    const resetTimer = window.setTimeout(() => {
      setProgress(0);
    }, 0);

    return () => {
      window.clearTimeout(resetTimer);
    };
  }, [currentStory]);

  useEffect(() => {
    let isMounted = true;

    const timeoutId = window.setTimeout(() => {
      async function loadUserPreviews() {
        try {
          const [prevPreview, nextPreview] = await Promise.all([
            prevUserId ? getStoryPreview(prevUserId) : Promise.resolve(null),
            nextUserId ? getStoryPreview(nextUserId) : Promise.resolve(null),
          ]);

          if (isMounted) {
            setPrevUserPreview(prevPreview);
            setNextUserPreview(nextPreview);
          }
        } catch {
          if (isMounted) {
            setPrevUserPreview(null);
            setNextUserPreview(null);
          }
        }
      }

      void loadUserPreviews();
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [nextUserId, prevUserId]);

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((index) => index + 1);
      return;
    }

    if (nextUserId) {
      router.push(`/story/${nextUserId}?users=${orderedUsersQuery}`);
      return;
    }

    router.replace(FEED_REFRESH_URL);
  }, [currentIndex, nextUserId, orderedUsersQuery, router, stories.length]);

  const goPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((index) => index - 1);
      return;
    }

    if (prevUserId) {
      router.push(`/story/${prevUserId}?users=${orderedUsersQuery}`);
    }
  }, [currentIndex, orderedUsersQuery, prevUserId, router]);

  useEffect(() => {
    if (!currentStory || isPaused) {
      return;
    }

    const timer = window.setInterval(() => {
      setProgress((currentProgress) => {
        const nextProgress = currentProgress + (PROGRESS_TICK_MS / STORY_DURATION_MS) * 100;

        if (nextProgress < 100) {
          return nextProgress;
        }

        window.clearInterval(timer);

        if (currentIndex < stories.length - 1) {
          setCurrentIndex((index) => index + 1);
        } else {
          window.setTimeout(() => {
            goNext();
          }, 0);
        }

        return 100;
      });
    }, PROGRESS_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [currentIndex, currentStory, goNext, isPaused, stories.length]);

  async function openViewerSheet() {
    if (!currentStory?.isMine) {
      return;
    }

    try {
      setIsPaused(true);
      const loadedViewers = await getStoryViewers(currentStory.id);
      setViewers(loadedViewers);
      setIsViewerSheetOpen(true);
    } catch (viewerError) {
      setIsPaused(false);
      console.error("스토리 조회자 목록 조회 실패", viewerError);
    }
  }

  async function handleStoryLike() {
    if (!currentStory || currentStory.isMine || isLikeLoading) {
      return;
    }

    const previousLiked = isStoryLiked;

    try {
      setIsLikeLoading(true);
      setIsStoryLiked(!previousLiked);

      const result = await toggleStoryLike(currentStory.id);
      setIsStoryLiked(result.liked);
    } catch (likeError) {
      setIsStoryLiked(previousLiked);
      console.error("스토리 좋아요 토글 실패", likeError);
    } finally {
      setIsLikeLoading(false);
    }
  }

  async function handleDeleteStory() {
    if (!currentStory?.isMine) {
      return;
    }

    const deletedStoryId = currentStory.id;

    try {
      await deleteStory(deletedStoryId);

      if (currentIndex >= stories.length - 1) {
        router.replace(FEED_REFRESH_URL);
        return;
      }

      setStories((currentStories) =>
        currentStories.filter((story) => story.id !== deletedStoryId),
      );
      setProgress(0);
      setIsPaused(false);
    } catch (deleteError) {
      setIsPaused(false);
      console.error("스토리 삭제 실패", deleteError);
    }
  }

  function showToast(message: string, type: ToastState["type"] = "success") {
    setToast({
      isVisible: true,
      message,
      type,
    });
  }

  async function handleConfirmReportStory() {
    setIsReportConfirmOpen(false);

    if (!currentStory) {
      setIsPaused(false);
      return;
    }

    try {
      await createReport({ targetId: currentStory.id, targetType: "story" });
      showToast("신고가 접수되었습니다.");
    } catch (reportError) {
      showToast(
        reportError instanceof Error ? reportError.message : "신고에 실패했습니다.",
        "error",
      );
    } finally {
      setIsPaused(false);
    }
  }

  function closeActionSheet() {
    setIsActionSheetOpen(false);

    if (keepPausedAfterActionSheetCloseRef.current) {
      keepPausedAfterActionSheetCloseRef.current = false;
      return;
    }

    setIsPaused(false);
  }

  function togglePause() {
    setIsPaused((currentIsPaused) => !currentIsPaused);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-sm font-medium text-white">
        스토리를 불러오는 중...
      </div>
    );
  }

  if (error || !currentStory) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <p className="text-sm font-medium text-zinc-300">
          {error ?? "볼 수 있는 스토리가 없습니다."}
        </p>
        <button
          type="button"
          onClick={() => router.replace(FEED_REFRESH_URL)}
          className="rounded-full bg-white px-5 py-3 text-sm font-bold text-zinc-950"
        >
          피드로 돌아가기
        </button>
      </div>
    );
  }

  const actionSheetItems: ActionSheetItem[] = currentStory.isMine
    ? [
        {
          danger: true,
          label: "삭제",
          onClick: () => {
            keepPausedAfterActionSheetCloseRef.current = true;
            setIsPaused(true);
            setIsDeleteConfirmOpen(true);
          },
        },
        {
          label: "취소",
          onClick: () => {},
        },
      ]
    : [
        {
          danger: true,
          label: "신고",
          onClick: () => {
            keepPausedAfterActionSheetCloseRef.current = true;
            setIsPaused(true);
            setIsReportConfirmOpen(true);
          },
        },
        {
          label: "취소",
          onClick: () => {},
        },
      ];

  return (
    <main className="relative flex h-dvh w-screen items-center justify-center overflow-hidden bg-black text-white sm:min-h-screen sm:py-8">
      <button
        type="button"
        onClick={() => router.replace(FEED_REFRESH_URL)}
        className="fixed right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-30 rounded-full bg-black/30 p-2 text-white backdrop-blur sm:top-4"
        aria-label="스토리 닫기"
      >
        <CloseIcon />
      </button>

      <div className="relative flex h-full w-full items-start justify-center sm:grid sm:h-auto sm:max-w-5xl sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4 sm:px-4">
        <div className="hidden items-center justify-end gap-3 sm:flex">
          {prevUserPreview && prevUserId ? (
            <UserPreviewCard
              preview={prevUserPreview}
              onClick={() => {
                router.push(`/story/${prevUserId}?users=${orderedUsersQuery}`);
              }}
            />
          ) : null}
          {currentIndex > 0 || prevUserId ? (
            <button
              type="button"
              onClick={goPrevious}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/30"
              aria-label="이전 스토리"
            >
              <ArrowIcon direction="left" />
            </button>
          ) : null}
        </div>

        <div className="relative aspect-[9/16] w-full max-w-[56.25dvh] overflow-hidden bg-black sm:h-[calc(100vh-4rem)] sm:w-auto sm:max-w-full sm:rounded-lg">
          <StoryTopOverlay
            currentIndex={currentIndex}
            currentStory={currentStory}
            isPaused={isPaused}
            onOpenActions={() => {
              setIsPaused(true);
              setIsActionSheetOpen(true);
            }}
            onOpenProfile={() => {
              router.push(`/profile/${currentStory.user.nickname}`);
            }}
            progress={progress}
            stories={stories}
          />

          <button
            type="button"
            onClick={togglePause}
            className="absolute inset-0 z-10 overflow-hidden"
            aria-label={isPaused ? "스토리 재생" : "스토리 일시정지"}
          >
            <Image
              src={currentStory.image_url}
              alt=""
              aria-hidden="true"
              fill
              sizes="100vw"
              className="scale-110 object-cover blur-xl"
            />
            <Image
              src={currentStory.image_url}
              alt="스토리 이미지"
              fill
              sizes="(max-width: 640px) 100vw, 470px"
              className={`z-10 ${isPortrait ? "object-cover" : "object-contain"}`}
              onLoad={(e) => {
                const img = e.currentTarget;
                setIsPortrait(img.naturalHeight > img.naturalWidth);
              }}
            />
          </button>

          {currentIndex > 0 || prevUserId ? (
            <button
              type="button"
              onClick={goPrevious}
              className="absolute left-0 top-24 z-20 h-[calc(100%-12rem)] w-1/3 sm:hidden"
              aria-label="이전 스토리"
            >
              <span className="sr-only">이전 스토리</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={goNext}
            className="absolute right-0 top-24 z-20 h-[calc(100%-12rem)] w-1/3 sm:hidden"
            aria-label={currentIndex >= stories.length - 1 ? "피드로 이동" : "다음 스토리"}
          >
            <span className="sr-only">
              {currentIndex >= stories.length - 1 ? "피드로 이동" : "다음 스토리"}
            </span>
          </button>

          <div className="pointer-events-none absolute inset-x-0 top-0 z-[15] h-36 bg-gradient-to-b from-black/50 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-36 bg-gradient-to-b from-transparent to-black/50" />

          <StoryBottomActions
            className={`absolute bottom-0 z-20 hidden px-5 pb-6 sm:flex ${
              currentStory.isMine ? "left-0 right-0 justify-start" : "right-0 justify-end"
            }`}
            currentStory={currentStory}
            isLikeLoading={isLikeLoading}
            isStoryLiked={isStoryLiked}
            onLike={handleStoryLike}
            onOpenViewers={() => {
              void openViewerSheet();
            }}
          />
        </div>

        <div className="hidden items-center justify-start gap-3 sm:flex">
          <button
            type="button"
            onClick={goNext}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/30"
            aria-label={currentIndex >= stories.length - 1 ? "피드로 이동" : "다음 스토리"}
          >
            <ArrowIcon direction="right" />
          </button>
          {nextUserPreview && nextUserId ? (
            <UserPreviewCard
              preview={nextUserPreview}
              onClick={() => {
                router.push(`/story/${nextUserId}?users=${orderedUsersQuery}`);
              }}
            />
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-36 bg-gradient-to-t from-black/80 to-transparent sm:hidden" />
      <StoryBottomActions
        className={`absolute inset-x-0 bottom-0 z-30 flex px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:hidden ${
          currentStory.isMine ? "justify-start" : "justify-end"
        }`}
        currentStory={currentStory}
        isLikeLoading={isLikeLoading}
        isStoryLiked={isStoryLiked}
        onLike={handleStoryLike}
        onOpenViewers={() => {
          void openViewerSheet();
        }}
      />

      <ViewerSheet
        isOpen={isViewerSheetOpen}
        onClose={() => {
          setIsViewerSheetOpen(false);
          setIsPaused(false);
        }}
        onViewerClick={(viewer) => {
          setIsViewerSheetOpen(false);
          setIsPaused(false);
          router.push(`/profile/${encodeURIComponent(viewer.nickname)}`);
        }}
        viewers={viewers}
      />
      <ActionSheet
        isOpen={isActionSheetOpen}
        items={actionSheetItems}
        onClose={closeActionSheet}
      />
      <ConfirmDialog
        confirmLabel="삭제"
        description="삭제된 스토리는 복구되지 않습니다."
        isOpen={isDeleteConfirmOpen}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setIsPaused(false);
        }}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          void handleDeleteStory();
        }}
        title="스토리를 삭제할까요?"
      />
      <ConfirmDialog
        confirmLabel="신고"
        description="이 콘텐츠를 신고하시겠습니까?"
        isOpen={isReportConfirmOpen}
        onCancel={() => {
          setIsReportConfirmOpen(false);
          setIsPaused(false);
        }}
        onConfirm={() => {
          void handleConfirmReportStory();
        }}
        title="신고하시겠습니까?"
      />
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onHide={() => {
          setToast((currentToast) => ({
            ...currentToast,
            isVisible: false,
          }));
        }}
      />
    </main>
  );
}
