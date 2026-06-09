"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ActionSheet, type ActionSheetItem } from "@/components/common/ActionSheet";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Toast } from "@/components/common/Toast";
import { ImageCarousel } from "@/components/feed/ImageCarousel";
import {
  addReply,
  CommentInput,
  CommentsList,
  flattenComments,
  removeComment,
  type ReplyTarget,
  updateCommentLikes,
} from "@/components/feed/PostComments";
import {
  PostActions,
  PostBody,
  PostDetailSkeleton,
  PostHeader,
} from "@/components/feed/PostDetailParts";
import {
  createComment,
  deleteComment,
  getComments,
  getCurrentCommentUserId,
  getLikedCommentIds,
  toggleCommentLike,
  type Comment,
} from "@/features/comments/api";
import {
  deletePost,
  getLikedPostIds,
  getPost,
  togglePostLike,
  type PostDetail as FeedPostDetail,
} from "@/features/feed/api";
import { createReport } from "@/features/reports/api";

interface PostDetailProps {
  onClose?: () => void;
  postId: string;
}

type ToastState = {
  isVisible: boolean;
  message: string;
  type: "success" | "error";
};

export function PostDetail({ onClose, postId }: PostDetailProps) {
  const router = useRouter();
  const isModal = Boolean(onClose);
  const isLikePendingRef = useRef(false);
  const [commentContent, setCommentContent] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedReplyIds, setExpandedReplyIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportConfirmOpen, setIsReportConfirmOpen] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [post, setPost] = useState<FeedPostDetail | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadPostDetail() {
      try {
        setIsLoading(true);
        setIsCommentsLoading(true);
        setError(null);

        const [loadedPost, likedPostIds, loadedComments, loadedCurrentUserId] =
          await Promise.all([
            getPost(postId),
            getLikedPostIds([postId]),
            getComments(postId),
            getCurrentCommentUserId(),
          ]);
        const loadedLikedCommentIds = await getLikedCommentIds(
          flattenComments(loadedComments).map((comment) => comment.id),
        );

        if (!isMounted) {
          return;
        }

        setPost({
          ...loadedPost,
          comments_count: loadedComments.length,
        });
        setIsLiked(likedPostIds.includes(postId));
        setComments(loadedComments);
        setCurrentUserId(loadedCurrentUserId);
        setExpandedReplyIds(new Set());
        setLikedCommentIds(new Set(loadedLikedCommentIds));
        setReplyTarget(null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "게시물을 불러오지 못했습니다.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsCommentsLoading(false);
        }
      }
    }

    void loadPostDetail();

    return () => {
      isMounted = false;
    };
  }, [postId]);

  function showToast(message: string, type: ToastState["type"] = "success") {
    setToast({
      isVisible: true,
      message,
      type,
    });
  }

  async function handleCopyLink() {
    const postUrl = `${window.location.origin}/posts/${postId}`;

    try {
      await navigator.clipboard.writeText(postUrl);
      showToast("링크가 복사됐습니다");
    } catch {
      showToast("링크 복사에 실패했습니다", "error");
    }
  }

  async function handleDeletePost() {
    try {
      await deletePost(postId);
      showToast("게시물이 삭제됐습니다");
      window.setTimeout(() => {
        onClose?.();
      }, 700);
    } catch {
      showToast("게시물 삭제에 실패했습니다", "error");
    }
  }

  async function handleConfirmReportPost() {
    setIsReportConfirmOpen(false);

    try {
      await createReport({ targetId: postId, targetType: "post" });
      showToast("신고가 접수되었습니다.");
    } catch (reportError) {
      showToast(
        reportError instanceof Error ? reportError.message : "신고에 실패했습니다.",
        "error",
      );
    }
  }

  async function handleLike() {
    if (!post || isLikePendingRef.current) {
      return;
    }

    isLikePendingRef.current = true;
    const previousPost = post;
    const previousIsLiked = isLiked;
    const nextIsLiked = !isLiked;

    setIsLiked(nextIsLiked);
    setPost({
      ...post,
      likes_count: Math.max(0, post.likes_count + (nextIsLiked ? 1 : -1)),
    });

    try {
      const result = await togglePostLike(post.id);
      setIsLiked(result.liked);
      setPost((currentPost) =>
        currentPost
          ? {
              ...currentPost,
              likes_count: result.likesCount,
            }
          : currentPost,
      );
    } catch (likeError) {
      setPost(previousPost);
      setIsLiked(previousIsLiked);
      setError(
        likeError instanceof Error
          ? likeError.message
          : "좋아요 처리에 실패했습니다.",
      );
    } finally {
      isLikePendingRef.current = false;
    }
  }

  async function handleSubmitComment() {
    if (!post || commentContent.trim().length === 0 || isSubmittingComment) {
      return;
    }

    try {
      setIsSubmittingComment(true);
      setError(null);

      const createdComment = await createComment(
        post.id,
        commentContent,
        replyTarget?.parentId,
      );

      setCommentContent("");
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
        setComments((currentComments) => [createdComment, ...currentComments]);
        setPost((currentPost) =>
          currentPost
            ? {
                ...currentPost,
                comments_count: currentPost.comments_count + 1,
              }
            : currentPost,
        );
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "댓글 작성에 실패했습니다.",
      );
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
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

      setComments((currentComments) => removeComment(currentComments, commentId));
      setLikedCommentIds((currentLikedIds) => {
        const nextLikedIds = new Set(currentLikedIds);
        removedIds.forEach((removedId) => {
          nextLikedIds.delete(removedId);
        });
        return nextLikedIds;
      });
      setExpandedReplyIds((currentExpandedIds) => {
        const nextExpandedIds = new Set(currentExpandedIds);
        nextExpandedIds.delete(commentId);
        return nextExpandedIds;
      });

      if (deletedComment?.parent_id === null) {
        setPost((currentPost) =>
          currentPost
            ? {
                ...currentPost,
                comments_count: Math.max(0, currentPost.comments_count - 1),
              }
            : currentPost,
        );
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "댓글 삭제에 실패했습니다.",
      );
    } finally {
      setDeletingCommentId(null);
    }
  }

  async function handleCommentLike(commentId: string) {
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
      setComments(previousComments);
      setLikedCommentIds(previousLikedCommentIds);
      setError(
        likeError instanceof Error
          ? likeError.message
          : "댓글 좋아요 처리에 실패했습니다.",
      );
    }
  }

  function handleReplyComment(comment: Comment) {
    setReplyTarget({
      parentId: comment.id,
      nickname: comment.user.nickname,
    });
    setCommentContent(`@${comment.user.nickname} `);
  }

  function handleToggleReplies(commentId: string) {
    setExpandedReplyIds((currentExpandedIds) => {
      const nextExpandedIds = new Set(currentExpandedIds);

      if (nextExpandedIds.has(commentId)) {
        nextExpandedIds.delete(commentId);
      } else {
        nextExpandedIds.add(commentId);
      }

      return nextExpandedIds;
    });
  }

  if (isLoading) {
    return <PostDetailSkeleton />;
  }

  if (error && !post) {
    return (
      <section className="flex min-h-80 items-center justify-center bg-white px-6 text-center">
        <p className="text-sm font-semibold text-red-500">{error}</p>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="flex min-h-80 items-center justify-center bg-white px-6 text-center">
        <p className="text-sm font-medium text-zinc-500">
          게시물을 찾을 수 없습니다.
        </p>
      </section>
    );
  }

  const isOwnPost = currentUserId === post.user.id;
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
          label: "차단",
          onClick: () => {
            console.log("차단", post.user.id);
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

  const commentList = (
    <CommentsList
      comments={comments}
      currentUserId={currentUserId}
      deletingCommentId={deletingCommentId}
      expandedReplyIds={expandedReplyIds}
      isLoading={isCommentsLoading}
      likedCommentIds={likedCommentIds}
      onDelete={(commentId) => {
        void handleDeleteComment(commentId);
      }}
      onLike={(commentId) => {
        void handleCommentLike(commentId);
      }}
      onReply={handleReplyComment}
      onToggleReplies={handleToggleReplies}
    />
  );
  const commentInput = (
    <CommentInput
      content={commentContent}
      isSubmitting={isSubmittingComment}
      onChange={setCommentContent}
      onCancelReply={() => {
        setReplyTarget(null);
        setCommentContent("");
      }}
      onSubmit={() => {
        void handleSubmitComment();
      }}
      replyTarget={replyTarget}
    />
  );

  return (
    <article className="h-full bg-white">
      <div
        className={
          isModal
            ? "lg:flex lg:h-full lg:min-h-0 lg:w-fit lg:max-w-[1100px]"
            : "lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]"
        }
      >
        <div
          className={
            isModal
              ? "hidden min-h-0 bg-black lg:flex lg:h-full lg:w-fit lg:max-w-[600px] lg:shrink-0"
              : "hidden min-h-0 bg-black lg:flex lg:h-full"
          }
        >
          <ImageCarousel post={post} isModal={isModal} />
        </div>

        <div
          className={
            isModal
              ? "flex min-h-0 flex-col border-zinc-100 lg:h-full lg:w-[500px] lg:shrink-0 lg:border-l"
              : "flex min-h-0 flex-col border-zinc-100 lg:h-full lg:border-l"
          }
        >
          <PostHeader
            currentUserId={currentUserId}
            onClose={onClose}
            onOpenActions={() => {
              setIsActionSheetOpen(true);
            }}
            post={post}
          />

          <div className="lg:hidden">
            <ImageCarousel post={post} />
          </div>

          <div className="border-b border-zinc-100 px-4 py-4 lg:hidden">
            <PostActions
              commentsCount={post.comments_count}
              isLiked={isLiked}
              likesCount={post.likes_count}
              onLike={() => {
                void handleLike();
              }}
            />
            <PostBody post={post} />

            {error ? (
              <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </p>
            ) : null}

            <div className="mt-4">{commentInput}</div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto lg:hidden">
            {commentList}
          </div>

          <div className="hidden min-h-0 flex-1 overflow-y-auto lg:block">
            <div className="border-b border-zinc-100 px-4 py-4">
              <PostBody post={post} />
            </div>
            {commentList}
          </div>

          <div className="hidden shrink-0 border-t border-zinc-100 px-4 py-4 lg:block">
            <PostActions
              commentsCount={post.comments_count}
              isLiked={isLiked}
              likesCount={post.likes_count}
              onLike={() => {
                void handleLike();
              }}
            />

            {error ? (
              <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </p>
            ) : null}

            <div className="mt-4">{commentInput}</div>
          </div>
        </div>
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
