"use client";

import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type UIEvent } from "react";

import { ActionSheet, type ActionSheetItem } from "@/components/common/ActionSheet";
import { Toast } from "@/components/common/Toast";
import { UserInfo } from "@/components/common/UserInfo";
import {
  createComment,
  deleteComment,
  getComments,
  getCurrentCommentUserId,
  type Comment,
} from "@/features/comments/api";
import {
  deletePost,
  getLikedPostIds,
  getPost,
  togglePostLike,
  type PostDetail as FeedPostDetail,
} from "@/features/feed/api";

interface PostDetailProps {
  onClose?: () => void;
  postId: string;
}

type ToastState = {
  isVisible: boolean;
  message: string;
  type: "success" | "error";
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

function flattenComments(comments: Comment[]) {
  return comments.flatMap((comment) => [comment, ...comment.replies]);
}

function removeComment(comments: Comment[], commentId: string) {
  return comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: comment.replies.filter((reply) => reply.id !== commentId),
    }));
}

function PostDetailSkeleton() {
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

function ImageCarousel({ post }: { post: FeedPostDetail }) {
  const carouselId = useId();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasMultipleImages = post.images.length > 1;

  function handleImageScroll(event: UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;

    if (element.clientWidth === 0) {
      return;
    }

    setCurrentImageIndex(Math.round(element.scrollLeft / element.clientWidth));
  }

  function moveToImage(nextIndex: number) {
    const carousel = carouselRef.current;

    if (!carousel) {
      return;
    }

    carousel.scrollTo({
      behavior: "smooth",
      left: carousel.clientWidth * nextIndex,
    });
    setCurrentImageIndex(nextIndex);
  }

  if (post.images.length === 0) {
    return <div className="aspect-square bg-zinc-100" />;
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-black">
      <div
        id={carouselId}
        ref={carouselRef}
        onScroll={handleImageScroll}
        className="flex flex-1 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {post.images.map((image) => (
          <div
            key={image.id}
            className="flex h-full w-full shrink-0 snap-start items-center justify-center bg-black"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={`${post.user.nickname} 게시물 이미지`}
              className="max-h-full w-full object-contain"
            />
          </div>
        ))}
      </div>

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
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : null}

      {hasMultipleImages && currentImageIndex < post.images.length - 1 ? (
        <button
          type="button"
          onClick={() => {
            moveToImage(currentImageIndex + 1);
          }}
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-sm transition hover:bg-black/60"
          aria-label="다음 이미지"
          aria-controls={carouselId}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : null}

      {hasMultipleImages ? (
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
  );
}

function PostHeader({
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

function PostActions({
  commentsCount,
  isLiked,
  likesCount,
  onLike,
}: {
  commentsCount: number;
  isLiked: boolean;
  likesCount: number;
  onLike: () => void;
}) {
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

      <div className="flex items-center gap-1.5 text-zinc-700" aria-label="댓글 수">
        <MessageCircle className="h-6 w-6" aria-hidden="true" />
        <span className="text-sm font-medium">{commentsCount}</span>
      </div>
    </div>
  );
}

function PostBody({ post }: { post: FeedPostDetail }) {
  if (!post.content && post.hashtags.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3">
      {post.content ? (
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-950">
          {post.content}
        </p>
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

function CommentsList({
  comments,
  currentUserId,
  deletingCommentId,
  isLoading,
  onDelete,
}: {
  comments: Comment[];
  currentUserId: string | null;
  deletingCommentId: string | null;
  isLoading: boolean;
  onDelete: (commentId: string) => void;
}) {
  function renderComment(comment: Comment, isReply = false) {
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
          <p className="mt-1 pl-11 whitespace-pre-wrap break-words text-sm leading-5 text-zinc-700">
            {comment.content}
          </p>
        </div>

        {currentUserId === comment.user.id ? (
          <button
            type="button"
            onClick={() => {
              onDelete(comment.id);
            }}
            disabled={deletingCommentId === comment.id}
            className="shrink-0 self-start text-xs font-medium text-zinc-400 transition hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            삭제
          </button>
        ) : null}
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
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      ))}
    </div>
  );
}

function CommentInput({
  content,
  isSubmitting,
  onChange,
  onSubmit,
}: {
  content: string;
  isSubmitting: boolean;
  onChange: (content: string) => void;
  onSubmit: () => void;
}) {
  const canSubmit = content.trim().length > 0 && !isSubmitting;

  return (
    <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2">
      <input
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
  );
}

export function PostDetail({ onClose, postId }: PostDetailProps) {
  const router = useRouter();
  const [commentContent, setCommentContent] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [post, setPost] = useState<FeedPostDetail | null>(null);
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

  async function handleLike() {
    if (!post) {
      return;
    }

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
    }
  }

  async function handleSubmitComment() {
    if (!post || commentContent.trim().length === 0 || isSubmittingComment) {
      return;
    }

    try {
      setIsSubmittingComment(true);
      setError(null);

      const createdComment = await createComment(post.id, commentContent);

      setCommentContent("");
      setCurrentUserId(createdComment.user.id);
      setComments((currentComments) => [createdComment, ...currentComments]);
      setPost((currentPost) =>
        currentPost
          ? {
              ...currentPost,
              comments_count: currentPost.comments_count + 1,
            }
          : currentPost,
      );
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

      setComments((currentComments) => removeComment(currentComments, commentId));

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
            console.log("신고", post.id);
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
      isLoading={isCommentsLoading}
      onDelete={(commentId) => {
        void handleDeleteComment(commentId);
      }}
    />
  );
  const commentInput = (
    <CommentInput
      content={commentContent}
      isSubmitting={isSubmittingComment}
      onChange={setCommentContent}
      onSubmit={() => {
        void handleSubmitComment();
      }}
    />
  );

  return (
    <article className="h-full bg-white">
      <div className="lg:grid lg:h-full lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div className="hidden bg-black lg:flex lg:h-full">
          <ImageCarousel post={post} />
        </div>

        <div className="flex min-h-0 flex-col border-zinc-100 lg:max-h-[760px] lg:border-l">
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

          <div className="hidden border-t border-zinc-100 px-4 py-4 lg:block">
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
