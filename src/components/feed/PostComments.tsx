"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { UserInfo } from "@/components/common/UserInfo";
import type { Comment } from "@/features/comments/api";
import { getRelativeTimeLabel } from "@/lib/utils/time";

export type ReplyTarget = {
  parentId: string;
  nickname: string;
};

export function flattenComments(comments: Comment[]) {
  return comments.flatMap((comment) => [comment, ...comment.replies]);
}

export function removeComment(comments: Comment[], commentId: string) {
  return comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: comment.replies.filter((reply) => reply.id !== commentId),
    }));
}

export function updateCommentLikes(
  comments: Comment[],
  commentId: string,
  likesCount: number,
) {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      return { ...comment, likes_count: likesCount };
    }

    return {
      ...comment,
      replies: comment.replies.map((reply) =>
        reply.id === commentId ? { ...reply, likes_count: likesCount } : reply,
      ),
    };
  });
}

export function addReply(comments: Comment[], parentId: string, reply: Comment) {
  return comments.map((comment) =>
    comment.id === parentId
      ? { ...comment, replies: [...comment.replies, reply] }
      : comment,
  );
}

export function CommentHeartIcon({ isLiked }: { isLiked: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill={isLiked ? "currentColor" : "none"}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}

export function CommentContent({
  className,
  content,
  mentionNickname,
}: {
  className?: string;
  content: string;
  mentionNickname?: string;
}) {
  const mentionPrefix = mentionNickname ? `@${mentionNickname}` : "";
  const mentionSuffix = mentionPrefix ? content.slice(mentionPrefix.length) : "";
  const hasReplyMention =
    mentionPrefix.length > 0 &&
    content.startsWith(mentionPrefix) &&
    (mentionSuffix.length === 0 || /^\s/.test(mentionSuffix));

  return (
    <p className={className}>
      {hasReplyMention && mentionNickname ? (
        <>
          <Link
            href={`/profile/${encodeURIComponent(mentionNickname)}`}
            className="font-semibold text-zinc-950 transition hover:text-zinc-600"
          >
            {mentionPrefix}
          </Link>
          {mentionSuffix}
        </>
      ) : (
        content
      )}
    </p>
  );
}

export function CommentsList({
  comments,
  currentUserId,
  deletingCommentId,
  expandedReplyIds,
  isLoading,
  onDelete,
  onLike,
  onReply,
  onToggleReplies,
  likedCommentIds,
}: {
  comments: Comment[];
  currentUserId: string | null;
  deletingCommentId: string | null;
  expandedReplyIds: Set<string>;
  isLoading: boolean;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
  onReply: (comment: Comment) => void;
  onToggleReplies: (commentId: string) => void;
  likedCommentIds: Set<string>;
}) {
  function renderComment(
    comment: Comment,
    isReply = false,
    mentionNickname?: string,
  ) {
    const isCommentLiked = likedCommentIds.has(comment.id);

    return (
      <article
        key={comment.id}
        className={`flex gap-3 px-4 py-2 ${isReply ? "ml-11" : ""}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <UserInfo
              avatarUrl={comment.user.avatar_url}
              nickname={comment.user.nickname}
            />
            <span className="shrink-0 text-xs text-zinc-400">
              {getRelativeTimeLabel(comment.created_at)}
            </span>
          </div>
          <CommentContent
            className="mt-1 pl-11 whitespace-pre-wrap break-words text-sm leading-5 text-zinc-700"
            content={comment.content}
            mentionNickname={isReply ? mentionNickname : undefined}
          />

          {!isReply ? (
            <button
              type="button"
              onClick={() => {
                onReply(comment);
              }}
              className="ml-11 mt-2 text-xs font-semibold text-zinc-400 transition hover:text-zinc-700"
            >
              답글 달기
            </button>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onLike(comment.id);
            }}
            className={`flex shrink-0 items-center gap-1 text-xs font-semibold transition ${
              isCommentLiked
                ? "text-red-500"
                : "text-zinc-400 hover:text-zinc-700"
            }`}
            aria-label="댓글 좋아요"
          >
            <CommentHeartIcon isLiked={isCommentLiked} />
            <span>{comment.likes_count}</span>
          </button>

          {currentUserId === comment.user.id ? (
            <button
              type="button"
              onClick={() => {
                onDelete(comment.id);
              }}
              disabled={deletingCommentId === comment.id}
              className="shrink-0 text-xs font-medium text-zinc-400 transition hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              삭제
            </button>
          ) : null}
        </div>
      </article>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 py-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex animate-pulse gap-3 px-4 py-2">
            <div className="h-8 w-8 rounded-full bg-zinc-100" />
            <div className="flex-1">
              <div className="h-3 w-20 rounded-full bg-zinc-100" />
              <div className="mt-2 h-4 w-full rounded-full bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex min-h-36 items-center justify-center px-6 py-10">
        <p className="text-sm font-medium text-zinc-500">
          첫 댓글을 남겨보세요
        </p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {comments.map((comment) => (
        <div key={comment.id}>
          {renderComment(comment)}
          {comment.replies.length > 0 ? (
            <div>
              {expandedReplyIds.has(comment.id) ? (
                <>
                  {comment.replies.map((reply) =>
                    renderComment(reply, true, comment.user.nickname),
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onToggleReplies(comment.id);
                    }}
                    className="ml-[88px] py-1 text-xs font-semibold text-zinc-400 transition hover:text-zinc-700"
                  >
                    답글 숨기기
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onToggleReplies(comment.id);
                  }}
                  className="ml-[88px] py-1 text-xs font-semibold text-zinc-400 transition hover:text-zinc-700"
                >
                  답글 {comment.replies.length}개 보기
                </button>
              )}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function CommentInput({
  content,
  isSubmitting,
  onChange,
  onCancelReply,
  onSubmit,
  replyTarget,
}: {
  content: string;
  isSubmitting: boolean;
  onChange: (content: string) => void;
  onCancelReply: () => void;
  onSubmit: () => void;
  replyTarget: ReplyTarget | null;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const canSubmit = content.trim().length > 0 && !isSubmitting;

  useEffect(() => {
    if (!replyTarget) {
      return;
    }

    window.requestAnimationFrame(() => {
      const input = inputRef.current;

      input?.focus();
      input?.setSelectionRange(input.value.length, input.value.length);
    });
  }, [replyTarget]);

  return (
    <div>
      {replyTarget ? (
        <div className="mb-2 flex items-center justify-between rounded-2xl bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
          <span>{replyTarget.nickname}에게 답글 달기</span>
          <button
            type="button"
            onClick={onCancelReply}
            className="font-semibold text-zinc-700 transition hover:text-zinc-950"
          >
            취소
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2">
        <input
          ref={inputRef}
          value={content}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400"
          placeholder="댓글 달기..."
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="shrink-0 text-sm font-semibold text-zinc-950 transition disabled:cursor-not-allowed disabled:text-zinc-300"
        >
          {isSubmitting ? "게시 중" : "게시"}
        </button>
      </div>
    </div>
  );
}
