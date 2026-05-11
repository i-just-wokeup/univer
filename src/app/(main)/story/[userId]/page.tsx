"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ActionSheet, type ActionSheetItem } from "@/components/common/ActionSheet";
import {
  deleteStory,
  getMyStoryLikedStatus,
  getStoryViewers,
  getUserStories,
  recordStoryView,
  toggleStoryLike,
  type Story,
  type Viewer,
} from "@/features/stories/api";

const STORY_DURATION_MS = 5000;
const PROGRESS_TICK_MS = 50;

function getInitial(name: string) {
  return name.trim().charAt(0) || "?";
}

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
  viewers,
}: {
  isOpen: boolean;
  onClose: () => void;
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
                <li key={viewer.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {viewer.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={viewer.avatar_url}
                        alt={viewer.nickname}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700">
                        {getInitial(viewer.nickname)}
                      </span>
                    )}
                    <span className="truncate text-sm font-semibold">{viewer.nickname}</span>
                  </div>
                  <span className={viewer.isLiked ? "text-red-500" : "text-zinc-300"}>
                    <HeartIcon filled={viewer.isLiked} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StoryViewerPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const viewedStoryIdsRef = useRef<Set<string>>(new Set());
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

  const currentStory = stories[currentIndex] ?? null;

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
          router.replace("/");
        }

        return 100;
      });
    }, PROGRESS_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [currentIndex, currentStory, isPaused, router, stories.length]);

  async function openViewerSheet() {
    if (!currentStory?.isMine) {
      return;
    }

    try {
      const loadedViewers = await getStoryViewers(currentStory.id);
      setViewers(loadedViewers);
      setIsViewerSheetOpen(true);
    } catch (viewerError) {
      console.error("스토리 조회자 목록 조회 실패", viewerError);
    }
  }

  function goPrevious() {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  function goNext() {
    if (currentIndex >= stories.length - 1) {
      router.replace("/");
      return;
    }

    setCurrentIndex((index) => index + 1);
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
        router.replace("/");
        return;
      }

      setStories((currentStories) =>
        currentStories.filter((story) => story.id !== deletedStoryId),
      );
      setProgress(0);
    } catch (deleteError) {
      console.error("스토리 삭제 실패", deleteError);
    }
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
          onClick={() => router.replace("/")}
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
            void handleDeleteStory();
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
            console.log("신고", currentStory.id);
          },
        },
        {
          label: "취소",
          onClick: () => {},
        },
      ];

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-black px-0 py-8 text-white">
      <button
        type="button"
        onClick={() => router.replace("/")}
        className="fixed right-4 top-4 z-30 rounded-full bg-black/30 p-2 text-white backdrop-blur"
        aria-label="스토리 닫기"
      >
        <CloseIcon />
      </button>

      <div className="relative h-[calc(100vh-4rem)] w-auto max-w-full aspect-[9/16] overflow-hidden rounded-lg bg-black">
        <header className="absolute left-0 right-0 top-0 z-20 px-4 pt-4">
          <div className="mb-4 flex gap-1">
            {stories.map((story, index) => (
              <div key={story.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
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
            <div className="flex min-w-0 items-center gap-3">
              {currentStory.user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentStory.user.avatar_url}
                  alt={currentStory.user.nickname}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                  {getInitial(currentStory.user.nickname)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{currentStory.user.nickname}</p>
                <p className="text-xs text-white/70">
                  {formatRelativeTime(currentStory.created_at)}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {isPaused ? (
                <span className="text-white" aria-label="스토리 일시정지됨">
                  <PauseIcon />
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setIsActionSheetOpen(true)}
                className="text-white"
                aria-label="스토리 메뉴 열기"
              >
                <MoreIcon />
              </button>
            </div>
          </div>
        </header>

        <button
          type="button"
          onClick={togglePause}
          className="absolute inset-0 z-10 overflow-hidden"
          aria-label={isPaused ? "스토리 재생" : "스토리 일시정지"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentStory.image_url}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentStory.image_url}
            alt="스토리 이미지"
            className="relative z-10 h-full w-full object-contain"
          />
        </button>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[15] h-36 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-36 bg-gradient-to-b from-transparent to-black/50" />

        {currentStory.isMine ? (
          <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-8">
            <button
              type="button"
              onClick={openViewerSheet}
              className="inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-sm font-bold text-white backdrop-blur"
            >
              <EyeIcon />
              <span>{currentStory.views_count}명 봄</span>
            </button>
          </div>
        ) : (
          <div className="absolute bottom-0 right-0 z-20 px-4 pb-8">
            <button
              type="button"
              onClick={handleStoryLike}
              disabled={isLikeLoading}
              className={`p-1 transition disabled:opacity-60 ${
                isStoryLiked ? "text-red-500" : "text-white"
              }`}
              aria-label={isStoryLiked ? "스토리 좋아요 취소" : "스토리 좋아요"}
            >
              <span className="[&>svg]:h-6 [&>svg]:w-6">
                <HeartIcon filled={isStoryLiked} />
              </span>
            </button>
          </div>
        )}
      </div>

      {currentIndex > 0 ? (
        <button
          type="button"
          onClick={goPrevious}
          className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur sm:left-[calc(50%-275px)]"
          aria-label="이전 스토리"
        >
          <ArrowIcon direction="left" />
        </button>
      ) : null}

      <button
        type="button"
        onClick={goNext}
        className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur sm:right-[calc(50%-275px)]"
        aria-label={currentIndex >= stories.length - 1 ? "피드로 이동" : "다음 스토리"}
      >
        <ArrowIcon direction="right" />
      </button>

      <ViewerSheet
        isOpen={isViewerSheetOpen}
        onClose={() => setIsViewerSheetOpen(false)}
        viewers={viewers}
      />
      <ActionSheet
        isOpen={isActionSheetOpen}
        items={actionSheetItems}
        onClose={() => setIsActionSheetOpen(false)}
      />
    </main>
  );
}
