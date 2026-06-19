"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ActionSheet, type ActionSheetItem } from "@/components/common/ActionSheet";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Toast } from "@/components/common/Toast";
import { ProfileNicknameLink, UserInfo } from "@/components/common/UserInfo";
import { getPostAspectRatioClass } from "@/components/feed/postAspectRatio";
import { deletePost, type FeedPost } from "@/features/feed/api";
import { createReport } from "@/features/reports/api";

// 피드 카드가 외부 액션만 위임받도록 이벤트 핸들러를 props로 열어둔다.
type PostCardProps = {
  currentUserId?: string;
  isBookmarked?: boolean;
  isLiked?: boolean;
  onBlockUser?: (userId: string) => Promise<void> | void;
  onBookmark?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onLike?: (postId: string) => void;
  post: FeedPost;
};

type ToastState = {
  isVisible: boolean;
  message: string;
  type: "success" | "error";
};

// 더보기 아이콘은 실제 메뉴 구현 전까지 버튼 셸로만 사용한다.
function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

export function HeartIcon({ isLiked }: { isLiked: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={isLiked ? "currentColor" : "none"}
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M5 6.75A2.75 2.75 0 0 1 7.75 4h8.5A2.75 2.75 0 0 1 19 6.75v6.5A2.75 2.75 0 0 1 16.25 16H11l-4.5 4v-4H7.75A2.75 2.75 0 0 1 5 13.25v-6.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookmarkIcon({ isBookmarked }: { isBookmarked: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={isBookmarked ? "currentColor" : "none"}
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="M7 4.75h10a1 1 0 0 1 1 1v14.5L12 16.5l-6 3.75V5.75a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M15 5 8 12l7 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="m9 5 7 7-7 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 서버 UTC 시간을 클라이언트에서 간단한 상대 시간 라벨로 바꾼다.
function getRelativeTimeLabel(createdAt: string) {
  const createdTime = new Date(createdAt).getTime();
  const diffMs = Date.now() - createdTime;
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < hourMs) {
    const minutes = Math.max(1, Math.floor(diffMs / minuteMs));
    return `${minutes}분 전`;
  }

  if (diffMs < dayMs) {
    const hours = Math.max(1, Math.floor(diffMs / hourMs));
    return `${hours}시간 전`;
  }

  const days = Math.max(1, Math.floor(diffMs / dayMs));
  return `${days}일 전`;
}

// 피드 단일 카드. 데이터 조회 없이 전달된 post만 렌더링한다.
export function PostCard({
  currentUserId = "",
  isBookmarked = false,
  isLiked = false,
  onBlockUser,
  onBookmark,
  onComment,
  onDelete,
  onLike,
  post,
}: PostCardProps) {
  const router = useRouter();
  const carouselId = useId();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const scrollEndTimerRef = useRef<number | null>(null);
  const contentRef = useRef<HTMLParagraphElement | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [isContentOverflowing, setIsContentOverflowing] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isReportConfirmOpen, setIsReportConfirmOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: "",
    type: "success",
  });
  const hasMultipleImages = post.media.length > 1;
  const isOwnPost = post.user.id === currentUserId;
  const aspectRatioClass = getPostAspectRatioClass(post.aspect_ratio);

  function showToast(message: string, type: ToastState["type"] = "success") {
    setToast({
      isVisible: true,
      message,
      type,
    });
  }

  async function handleCopyLink() {
    const postUrl = `${window.location.origin}/posts/${post.id}`;

    try {
      await navigator.clipboard.writeText(postUrl);
      showToast("링크가 복사됐습니다");
    } catch {
      showToast("링크 복사에 실패했습니다", "error");
    }
  }

  async function handleDeletePost() {
    try {
      await deletePost(post.id);
      showToast("게시물이 삭제됐습니다");
      window.setTimeout(() => {
        onDelete?.(post.id);
      }, 700);
    } catch {
      showToast("게시물 삭제에 실패했습니다", "error");
    }
  }

  async function handleConfirmReportPost() {
    setIsReportConfirmOpen(false);

    try {
      await createReport({ targetId: post.id, targetType: "post" });
      showToast("신고가 접수되었습니다.");
    } catch (reportError) {
      showToast(
        reportError instanceof Error ? reportError.message : "신고에 실패했습니다.",
        "error",
      );
    }
  }

  async function handleConfirmBlockUser() {
    if (!onBlockUser || isBlocking) {
      return;
    }

    try {
      setIsBlocking(true);
      await onBlockUser(post.user.id);
      setIsBlockConfirmOpen(false);
      showToast("사용자를 차단했습니다.");
    } catch (blockError) {
      showToast(
        blockError instanceof Error
          ? blockError.message
          : "사용자 차단에 실패했습니다.",
        "error",
      );
    } finally {
      setIsBlocking(false);
    }
  }

  const actionSheetItems: ActionSheetItem[] = isOwnPost
    ? [
        {
          label: "수정",
          onClick: () => {
            router.push(`/write?postId=${post.id}`);
          },
        },
        {
          danger: true,
          label: "삭제",
          onClick: () => {
            void handleDeletePost();
          },
        },
        {
          label: "링크 복사",
          onClick: () => {
            void handleCopyLink();
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
            setIsReportConfirmOpen(true);
          },
        },
        {
          danger: true,
          label: "차단",
          onClick: () => {
            setIsBlockConfirmOpen(true);
          },
        },
        {
          label: "링크 복사",
          onClick: () => {
            void handleCopyLink();
          },
        },
        {
          label: "취소",
          onClick: () => {},
        },
      ];

  function handleContentRef(element: HTMLParagraphElement | null) {
    contentRef.current = element;

    if (!element) {
      return;
    }

    if (isContentExpanded) {
      return;
    }

    requestAnimationFrame(() => {
      const nextIsOverflowing = element.scrollHeight > element.clientHeight + 1;
      setIsContentOverflowing((currentIsOverflowing) =>
        currentIsOverflowing === nextIsOverflowing
          ? currentIsOverflowing
          : nextIsOverflowing,
      );
    });
  }

  // 스크롤이 멈춘 뒤에만 현재 이미지 인덱스를 갱신해 모바일 스와이프 중 배지 떨림을 줄인다.
  function updateCurrentImageIndexAfterScrollEnd() {
    if (scrollEndTimerRef.current !== null) {
      window.clearTimeout(scrollEndTimerRef.current);
    }

    scrollEndTimerRef.current = window.setTimeout(() => {
      scrollEndTimerRef.current = null;
      const element = carouselRef.current;

      if (!element || element.clientWidth === 0) {
        return;
      }

      const nextIndex = Math.min(
        post.media.length - 1,
        Math.max(0, Math.round(element.scrollLeft / element.clientWidth)),
      );
      setCurrentImageIndex((currentIndex) =>
        currentIndex === nextIndex ? currentIndex : nextIndex,
      );
    }, 120);
  }

  function moveToImage(nextIndex: number) {
    const carousel = carouselRef.current;

    if (!carousel) {
      return;
    }

    carousel.scrollTo({
      left: carousel.clientWidth * nextIndex,
      behavior: "smooth",
    });
    setCurrentImageIndex(nextIndex);
  }

  useEffect(() => {
    return () => {
      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, []);

  return (
    <article className="mb-2.5 overflow-hidden rounded-2xl border border-white/65 bg-white/82 sm:mb-3">
      <header className="flex items-center justify-between px-4 pb-2.5 pt-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <UserInfo
              avatarUrl={post.user.avatar_url}
              nickname={post.user.nickname}
            />
            <span className="shrink-0 text-xs font-normal text-krew-faint">
              ·
            </span>
            <span className="truncate text-xs font-normal text-krew-faint">
              {post.user.department} · {getRelativeTimeLabel(post.created_at)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsActionSheetOpen(true);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full text-krew-muted transition hover:bg-krew-accent-soft hover:text-krew-accent"
          aria-label="게시물 더보기"
        >
          <MoreIcon />
        </button>
      </header>

      {post.media.length > 0 ? (
        <div className={`relative overflow-hidden bg-black ${aspectRatioClass}`}>
          <div
            id={carouselId}
            ref={carouselRef}
            onScroll={updateCurrentImageIndexAfterScrollEnd}
            className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {post.media.map((image) => (
              <div
                key={image.id}
                className="relative h-full w-full shrink-0 snap-start bg-zinc-200"
              >
                <Image
                  src={image.url}
                  alt={`${post.user.nickname} 게시물 이미지`}
                  fill
                  sizes="(max-width: 640px) 100vw, 470px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          {hasMultipleImages ? (
            <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white sm:hidden">
              {currentImageIndex + 1}/{post.media.length}
            </div>
          ) : null}

          {hasMultipleImages && currentImageIndex > 0 ? (
            <button
              type="button"
              onClick={() => {
                moveToImage(currentImageIndex - 1);
              }}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-sm transition hover:bg-black/60"
              aria-label="이전 이미지"
              aria-controls={carouselId}
            >
              <ChevronLeftIcon />
            </button>
          ) : null}

          {hasMultipleImages && currentImageIndex < post.media.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                moveToImage(currentImageIndex + 1);
              }}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-sm transition hover:bg-black/60"
              aria-label="다음 이미지"
              aria-controls={carouselId}
            >
              <ChevronRightIcon />
            </button>
          ) : null}

          {hasMultipleImages ? (
            // 인디케이터는 현재 이미지 인덱스만 시각적으로 보여준다.
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/40 px-1.5 py-0.5">
              {post.media.map((image, index) => (
                <span
                  key={image.id}
                  className={`block h-1.5 w-1.5 rounded-full ${
                    index === currentImageIndex ? "bg-white" : "bg-white/40"
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="px-4 pb-3 pt-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onLike?.(post.id)}
              className={`flex items-center gap-1.5 text-sm font-extrabold transition hover:text-zinc-950 ${
                isLiked ? "text-krew-like" : "text-zinc-800"
              }`}
              aria-label="좋아요"
            >
              <HeartIcon isLiked={isLiked} />
              <span>{post.likes_count}</span>
            </button>

            <button
              type="button"
              onClick={() => onComment?.(post.id)}
              className="flex items-center gap-1.5 text-sm font-extrabold text-zinc-800 transition hover:text-zinc-950"
              aria-label="댓글"
            >
              <CommentIcon />
              <span>{post.comments_count}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onBookmark?.(post.id)}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-zinc-100 hover:text-zinc-950 ${
              isBookmarked ? "text-zinc-950" : "text-zinc-800"
            }`}
            aria-label={isBookmarked ? "저장 취소" : "게시물 저장"}
          >
            <BookmarkIcon isBookmarked={isBookmarked} />
          </button>
        </div>

        {post.content ? (
          <div className="mt-0.5">
            <p
              ref={handleContentRef}
              className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-950"
              style={
                isContentExpanded
                  ? undefined
                  : {
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                      display: "-webkit-box",
                      overflow: "hidden",
                    }
              }
            >
              <ProfileNicknameLink nickname={post.user.nickname}>
                {post.user.nickname}{" "}
              </ProfileNicknameLink>
              {post.content}
            </p>

            {isContentOverflowing ? (
              <button
                type="button"
                onClick={() => {
                  setIsContentExpanded((currentIsExpanded) => !currentIsExpanded);
                }}
                className="mt-0.5 text-sm font-semibold text-krew-muted transition hover:text-zinc-950"
              >
                {isContentExpanded ? "접기" : "...더보기"}
              </button>
            ) : null}
          </div>
        ) : null}

        {post.hashtags.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
            {post.hashtags.map((tag) => (
              <span
                key={tag}
                className="text-sm font-bold text-krew-accent"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <ActionSheet
        isOpen={isActionSheetOpen}
        items={actionSheetItems}
        onClose={() => {
          setIsActionSheetOpen(false);
        }}
      />
      <ConfirmDialog
        confirmLabel="신고"
        description="이 콘텐츠를 신고하시겠습니까?"
        isOpen={isReportConfirmOpen}
        onCancel={() => {
          setIsReportConfirmOpen(false);
        }}
        onConfirm={() => {
          void handleConfirmReportPost();
        }}
        title="신고하시겠습니까?"
      />
      <ConfirmDialog
        confirmLabel={isBlocking ? "차단 중..." : "차단"}
        description="이 사용자와 서로의 게시물 및 프로필이 보이지 않습니다. 기존 친구 관계도 삭제됩니다."
        isOpen={isBlockConfirmOpen}
        onCancel={() => {
          if (!isBlocking) {
            setIsBlockConfirmOpen(false);
          }
        }}
        onConfirm={() => {
          void handleConfirmBlockUser();
        }}
        title="사용자를 차단할까요?"
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
    </article>
  );
}
