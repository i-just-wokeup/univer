"use client";

import { useId, useState } from "react";
import type { FeedPost } from "@/features/feed/api";

// 피드 카드가 외부 액션만 위임받도록 이벤트 핸들러를 props로 열어둔다.
type PostCardProps = {
  onBookmark?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onLike?: (postId: string) => void;
  post: FeedPost;
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

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M12 20.25s-6.75-4.2-8.75-8.22C1.76 9.03 3.33 5.25 7.23 5.25c2.1 0 3.28 1.1 4.02 2.15.74-1.05 1.92-2.15 4.02-2.15 3.9 0 5.47 3.78 3.98 6.78C18.75 16.05 12 20.25 12 20.25Z"
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

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
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

// 아바타 이미지가 없을 때 닉네임 첫 글자를 fallback으로 사용한다.
function getInitial(name: string) {
  return name.trim().charAt(0) || "?";
}

// 피드 단일 카드. 데이터 조회 없이 전달된 post만 렌더링한다.
export function PostCard({
  onBookmark,
  onComment,
  onLike,
  post,
}: PostCardProps) {
  const carouselId = useId();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 스크롤 위치를 카드 폭으로 나눠 현재 보고 있는 이미지 인덱스를 계산한다.
  function handleImageScroll(event: React.UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;

    if (element.clientWidth === 0) {
      return;
    }

    const nextIndex = Math.round(element.scrollLeft / element.clientWidth);
    setCurrentImageIndex(nextIndex);
  }

  return (
    <article className="bg-white">
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700">
            {post.user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.user.avatar_url}
                alt={post.user.nickname}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{getInitial(post.user.nickname)}</span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="truncate font-semibold text-zinc-950">
                {post.user.nickname}
              </span>
              <span className="text-zinc-300">·</span>
              <span className="truncate text-zinc-500">{post.user.department}</span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">
              {getRelativeTimeLabel(post.created_at)}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
          aria-label="게시물 더보기"
        >
          <MoreIcon />
        </button>
      </header>

      {post.images.length > 0 ? (
        <div className="relative bg-white">
          <div
            id={carouselId}
            onScroll={handleImageScroll}
            className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {post.images.map((image) => (
              <div key={image.id} className="relative aspect-square w-full shrink-0 snap-start bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={`${post.user.nickname} 게시물 이미지`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>

          {post.images.length > 1 ? (
            // 인디케이터는 현재 이미지 인덱스만 시각적으로 보여준다.
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/40 px-2 py-1">
              {post.images.map((image, index) => (
                <span
                  key={image.id}
                  className={`block h-2 w-2 rounded-full ${
                    index === currentImageIndex ? "bg-white" : "bg-white/40"
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onLike?.(post.id)}
              className="flex items-center gap-1.5 text-zinc-700 transition hover:text-zinc-950"
              aria-label="좋아요"
            >
              <HeartIcon />
              <span className="text-sm font-medium">{post.likes_count}</span>
            </button>

            <button
              type="button"
              onClick={() => onComment?.(post.id)}
              className="flex items-center gap-1.5 text-zinc-700 transition hover:text-zinc-950"
              aria-label="댓글"
            >
              <CommentIcon />
              <span className="text-sm font-medium">{post.comments_count}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onBookmark?.(post.id)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
            aria-label="북마크"
          >
            <BookmarkIcon />
          </button>
        </div>

        {post.content ? (
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-800">
            {post.content}
          </p>
        ) : null}

        {post.hashtags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.hashtags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
