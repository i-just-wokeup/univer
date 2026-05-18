"use client";

import { useEffect, useState } from "react";

import { Avatar } from "@/components/common/Avatar";
import {
  createComment,
  deleteComment,
  getCurrentCommentUserId,
  getLikedCommentIds,
  getComments,
  toggleCommentLike,
  type Comment,
} from "@/features/comments/api";

type CommentSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange: (postId: string, nextCount: number) => void;
  postId: string | null;
};

type ReplyTarget = {
  parentId: string;
  nickname: string;
};

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

function CommentSkeleton() {
  return (
    <div className="flex animate-pulse gap-3 px-4 py-2">
      <div className="h-9 w-9 rounded-full bg-zinc-200" />
      <div className="flex-1">
        <div className="h-3 w-20 rounded-full bg-zinc-200" />
        <div className="mt-2 h-4 w-full rounded-full bg-zinc-100" />
        <div className="mt-2 h-4 w-2/3 rounded-full bg-zinc-100" />
      </div>
    </div>
  );
}

function HeartIcon({ isLiked }: { isLiked: boolean }) {
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

function flattenComments(comments: Comment[]) {
  return comments.flatMap((comment) => [comment, ...comment.replies]);
}

function updateCommentLikes(
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

function removeComment(comments: Comment[], commentId: string) {
  return comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: comment.replies.filter((reply) => reply.id !== commentId),
    }));
}

function addReply(comments: Comment[], parentId: string, reply: Comment) {
  return comments.map((comment) =>
    comment.id === parentId
      ? { ...comment, replies: [...comment.replies, reply] }
      : comment,
  );
}

export function CommentSheet({
  isOpen,
  onClose,
  onCommentCountChange,
  postId,
}: CommentSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedReplyIds, setExpandedReplyIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);

  useEffect(() => {
    if (!isOpen || !postId) {
      return;
    }

    let isMounted = true;

    const loadComments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [loadedComments, currentUserId] = await Promise.all([
          getComments(postId),
          getCurrentCommentUserId(),
        ]);
        const likedIds = await getLikedCommentIds(
          flattenComments(loadedComments).map((comment) => comment.id),
        );

        if (!isMounted) {
          return;
        }

        setComments(loadedComments);
        setCurrentUserId(currentUserId);
        setLikedCommentIds(new Set(likedIds));
        onCommentCountChange(postId, loadedComments.length);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : "댓글을 불러오지 못했습니다.";

        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadComments();

    return () => {
      isMounted = false;
    };
  }, [isOpen, onCommentCountChange, postId]);

  if (!isOpen || !postId) {
    return null;
  }

  const canSubmit = content.trim().length > 0 && !isSubmitting;

  const handleClose = () => {
    setContent("");
    setComments([]);
    setCurrentUserId(null);
    setDeletingCommentId(null);
    setError(null);
    setExpandedReplyIds(new Set());
    setIsSubmitting(false);
    setLikedCommentIds(new Set());
    setReplyTarget(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const createdComment = await createComment(
        postId,
        content,
        replyTarget?.parentId,
      );

      setContent("");
      setCurrentUserId(createdComment.user.id);
      setReplyTarget(null);

      if (createdComment.parent_id) {
        const parentId = createdComment.parent_id;

        setComments((currentComments) =>
          addReply(currentComments, parentId, createdComment),
        );
        setExpandedReplyIds((currentExpandedIds) => {
          const nextExpandedIds = new Set(currentExpandedIds);
          nextExpandedIds.add(parentId);
          return nextExpandedIds;
        });
      } else {
        const nextComments = [createdComment, ...comments];
        setComments(nextComments);
        onCommentCountChange(postId, nextComments.length);
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "댓글 작성에 실패했습니다.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      setDeletingCommentId(commentId);
      setError(null);

      await deleteComment(commentId);

      const deletedComment = flattenComments(comments).find(
        (comment) => comment.id === commentId,
      );
      const removedIds =
        deletedComment?.parent_id === null
          ? [
              deletedComment.id,
              ...(comments
                .find((comment) => comment.id === commentId)
                ?.replies.map((reply) => reply.id) ?? []),
            ]
          : [commentId];
      const nextComments = removeComment(comments, commentId);

      setComments(nextComments);
      setLikedCommentIds((currentLikedIds) => {
        const nextLikedIds = new Set(currentLikedIds);
        removedIds.forEach((removedId) => {
          nextLikedIds.delete(removedId);
        });
        return nextLikedIds;
      });

      if (deletedComment?.parent_id === null) {
        onCommentCountChange(postId, nextComments.length);
      }
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "댓글 삭제에 실패했습니다.";

      setError(message);
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleLike = async (commentId: string) => {
    const wasLiked = likedCommentIds.has(commentId);
    const previousComments = comments;
    const previousLikedCommentIds = new Set(likedCommentIds);

    setError(null);
    setLikedCommentIds((currentLikedIds) => {
      const nextLikedIds = new Set(currentLikedIds);

      if (wasLiked) {
        nextLikedIds.delete(commentId);
      } else {
        nextLikedIds.add(commentId);
      }

      return nextLikedIds;
    });
    setComments((currentComments) =>
      updateCommentLikes(
        currentComments,
        commentId,
        Math.max(
          0,
          (flattenComments(currentComments).find(
            (comment) => comment.id === commentId,
          )?.likes_count ?? 0) + (wasLiked ? -1 : 1),
        ),
      ),
    );

    try {
      const result = await toggleCommentLike(commentId);

      setLikedCommentIds((currentLikedIds) => {
        const nextLikedIds = new Set(currentLikedIds);

        if (result.liked) {
          nextLikedIds.add(commentId);
        } else {
          nextLikedIds.delete(commentId);
        }

        return nextLikedIds;
      });
      setComments((currentComments) =>
        updateCommentLikes(currentComments, commentId, result.likesCount),
      );
    } catch (likeError) {
      const message =
        likeError instanceof Error
          ? likeError.message
          : "댓글 좋아요 처리에 실패했습니다.";

      setComments(previousComments);
      setLikedCommentIds(previousLikedCommentIds);
      setError(message);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyTarget({
      parentId: comment.id,
      nickname: comment.user.nickname,
    });
    setContent(`@${comment.user.nickname} `);
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <article
      key={comment.id}
      className={`flex gap-3 px-4 py-2 ${isReply ? "ml-11" : ""}`}
  >
      <Avatar
        src={comment.user.avatar_url}
        nickname={comment.user.nickname}
        size="xs"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-zinc-950">
            {comment.user.nickname}
          </span>
          <span className="shrink-0 text-xs text-zinc-400">
            {getRelativeTimeLabel(comment.created_at)}
          </span>
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-zinc-700">
          {comment.content}
        </p>

        {!isReply ? (
          <button
            type="button"
            onClick={() => {
              handleReply(comment);
            }}
            className="mt-2 text-xs font-semibold text-zinc-400 transition hover:text-zinc-700"
          >
            답글 달기
          </button>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => {
            void handleLike(comment.id);
          }}
          className={`flex shrink-0 items-center gap-1 text-xs font-semibold transition ${
            likedCommentIds.has(comment.id)
              ? "text-red-500"
              : "text-zinc-400 hover:text-zinc-700"
          }`}
          aria-label="댓글 좋아요"
        >
          <HeartIcon isLiked={likedCommentIds.has(comment.id)} />
          <span>{comment.likes_count}</span>
        </button>

        {currentUserId === comment.user.id ? (
          <button
            type="button"
            onClick={() => {
              void handleDelete(comment.id);
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="댓글 닫기"
        onClick={handleClose}
      />

      <section className="relative flex h-[78vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[640px] sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-950">
            댓글 {comments.length}개
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
            aria-label="닫기"
          >
            ×
          </button>
        </header>

        {error ? (
          <div className="mx-4 mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto py-2">
          {isLoading ? (
            <>
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
            </>
          ) : null}

          {!isLoading && comments.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 py-16">
              <p className="text-sm font-medium text-zinc-500">
                첫 댓글을 남겨보세요
              </p>
            </div>
          ) : null}

          {!isLoading
            ? comments.map((comment) => (
                <div key={comment.id}>
                  {renderComment(comment)}

                  {comment.replies.length > 0 ? (
                    <div>
                      {expandedReplyIds.has(comment.id) ? (
                        <>
                          {comment.replies.map((reply) => renderComment(reply, true))}
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedReplyIds((currentExpandedIds) => {
                                const nextExpandedIds = new Set(currentExpandedIds);
                                nextExpandedIds.delete(comment.id);
                                return nextExpandedIds;
                              });
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
                            setExpandedReplyIds((currentExpandedIds) => {
                              const nextExpandedIds = new Set(currentExpandedIds);
                              nextExpandedIds.add(comment.id);
                              return nextExpandedIds;
                            });
                          }}
                          className="ml-[88px] py-1 text-xs font-semibold text-zinc-400 transition hover:text-zinc-700"
                        >
                          답글 {comment.replies.length}개 보기
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              ))
            : null}
        </div>

        <footer className="border-t border-zinc-100 bg-white px-4 py-3">
          {replyTarget ? (
            <div className="mb-2 flex items-center justify-between rounded-2xl bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
              <span>
                {replyTarget.nickname}에게 답글 달기
              </span>
              <button
                type="button"
                onClick={() => {
                  setReplyTarget(null);
                  setContent("");
                }}
                className="font-semibold text-zinc-700 transition hover:text-zinc-950"
              >
                취소
              </button>
            </div>
          ) : null}

          <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2">
            <input
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400"
              placeholder="댓글 달기..."
            />
            <button
              type="button"
              onClick={() => {
                void handleSubmit();
              }}
              disabled={!canSubmit}
              className="shrink-0 text-sm font-semibold text-zinc-950 transition disabled:cursor-not-allowed disabled:text-zinc-300"
            >
              {isSubmitting ? "게시 중" : "게시"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
