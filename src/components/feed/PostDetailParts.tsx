"use client";

import { Heart, MessageCircle, MoreHorizontal, X } from "lucide-react";
import { useState } from "react";

import { UserInfo } from "@/components/common/UserInfo";
import type { PostDetail as FeedPostDetail } from "@/features/feed/api";
import { getRelativeTimeLabel } from "@/lib/utils/time";

export function PostDetailSkeleton() {
  return (
    <div className="grid animate-pulse bg-white lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
      <div className="aspect-square bg-zinc-100" />
      <div className="flex min-h-[520px] flex-col border-zinc-100 lg:border-l">
        <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
          <div className="h-9 w-9 rounded-full bg-zinc-100" />
          <div className="min-w-0 flex-1">
            <div className="h-3 w-24 rounded-full bg-zinc-100" />
            <div className="mt-2 h-3 w-16 rounded-full bg-zinc-100" />
          </div>
        </div>
        <div className="flex-1 space-y-4 px-4 py-5">
          <div className="h-4 w-4/5 rounded-full bg-zinc-100" />
          <div className="h-4 w-2/3 rounded-full bg-zinc-100" />
          <div className="h-4 w-3/4 rounded-full bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}

export function PostHeader({
  currentUserId,
  onClose,
  onOpenActions,
  post,
}: {
  currentUserId: string | null;
  onClose?: () => void;
  onOpenActions: () => void;
  post: FeedPostDetail;
}) {
  const isOwnPost = currentUserId === post.user.id;

  return (
    <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <UserInfo
            avatarUrl={post.user.avatar_url}
            nickname={post.user.nickname}
          />
          {/*
          <span className="text-zinc-300">·</span>
          <span className="truncate text-zinc-500">{post.user.department}</span>
          */}
        </div>
        <p className="mt-0.5 pl-11 text-xs text-zinc-400">
          {getRelativeTimeLabel(post.created_at)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onOpenActions}
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
          aria-label={isOwnPost ? "내 게시물 메뉴" : "게시물 메뉴"}
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
        </button>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
            aria-label="닫기"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </header>
  );
}

export function PostActions({
  commentsCount,
  isLiked,
  likesCount,
  onComment,
  onLike,
}: {
  commentsCount: number;
  isLiked: boolean;
  likesCount: number;
  onComment?: () => void;
  onLike: () => void;
}) {
  const commentContent = (
    <>
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
      <span className="text-sm font-medium">{commentsCount}</span>
    </>
  );

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={onLike}
        className={`flex items-center gap-1.5 transition hover:text-zinc-950 ${
          isLiked ? "text-red-500" : "text-zinc-700"
        }`}
        aria-label="좋아요"
      >
        <Heart
          className="h-6 w-6"
          fill={isLiked ? "currentColor" : "none"}
          aria-hidden="true"
        />
        <span className="text-sm font-medium">{likesCount}</span>
      </button>

      {onComment ? (
        <button
          type="button"
          onClick={onComment}
          className="flex items-center gap-1.5 text-zinc-700 transition hover:text-zinc-950"
          aria-label="댓글 보기"
        >
          {commentContent}
        </button>
      ) : (
        <div className="flex items-center gap-1.5 text-zinc-700" aria-label="댓글 수">
          {commentContent}
        </div>
      )}
    </div>
  );
}

export function PostBody({
  isCollapsible = false,
  post,
}: {
  isCollapsible?: boolean;
  post: FeedPostDetail;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!post.content && post.hashtags.length === 0) {
    return null;
  }

  const contentLineCount = post.content?.split(/\r\n|\r|\n/).length ?? 0;
  const shouldShowToggle =
    isCollapsible &&
    Boolean(post.content) &&
    ((post.content?.length ?? 0) > 140 || contentLineCount > 3);

  return (
    <div className="mt-3 space-y-3">
      {post.content ? (
        <div>
          <p
            className={`whitespace-pre-wrap break-words text-sm leading-6 text-zinc-950 ${
              shouldShowToggle && !isExpanded ? "line-clamp-3" : ""
            }`}
          >
            {post.content}
          </p>
          {shouldShowToggle ? (
            <button
              type="button"
              onClick={() => {
                setIsExpanded((currentIsExpanded) => !currentIsExpanded);
              }}
              className="mt-1 text-sm font-semibold text-zinc-500 transition hover:text-zinc-950"
            >
              {isExpanded ? "접기" : "더보기"}
            </button>
          ) : null}
        </div>
      ) : null}

      {post.hashtags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
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
  );
}
