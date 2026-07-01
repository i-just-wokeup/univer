import { useCallback, useEffect, useRef, useState } from "react";
import type { TextInput } from "react-native";

import {
  createComment,
  deleteComment,
  getComments,
  getCurrentCommentUserId,
  getLikedCommentIds,
  toggleCommentLike,
} from "./api";
import type { Comment } from "./types";

type ReplyTarget = {
  nickname: string;
  parentId: string;
};

type UseCommentsParams = {
  isOpen: boolean;
  onCommentCountChange: (postId: string, nextCount: number) => void;
  postId: string | null;
};

export function flattenComments(comments: Comment[]) {
  return comments.flatMap((comment) => [comment, ...comment.replies]);
}

export function addReply(comments: Comment[], parentId: string, reply: Comment) {
  return comments.map((comment) =>
    comment.id === parentId
      ? { ...comment, replies: [...comment.replies, reply] }
      : comment,
  );
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

export function useComments({
  isOpen,
  onCommentCountChange,
  postId,
}: UseCommentsParams) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedReplyIds, setExpandedReplyIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );
  const inputRef = useRef<TextInput | null>(null);
  // onCommentCountChange를 ref로 담아 로드 effect 의존성에서 제거한다.
  // (부모가 함수를 useCallback으로 안 감싸도 effect가 재실행돼 깜빡이지 않게)
  const onCommentCountChangeRef = useRef(onCommentCountChange);
  onCommentCountChangeRef.current = onCommentCountChange;

  useEffect(() => {
    if (!isOpen || !postId) {
      return;
    }

    setContent("");
    setReplyTarget(null);
    setExpandedReplyIds(new Set());
    setErrorMessage("");
    let isMounted = true;

    async function loadComments() {
      if (!postId) {
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");
        const [loadedComments, loadedUserId] = await Promise.all([
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
        setCurrentUserId(loadedUserId);
        setLikedCommentIds(new Set(likedIds));
        // 부모 상태 갱신은 이 렌더 사이클 밖으로 미룬다(렌더 중 부모 setState 경고 방지).
        const nextCount = loadedComments.length;
        queueMicrotask(() => {
          onCommentCountChangeRef.current(postId, nextCount);
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "댓글을 불러오지 못했습니다.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadComments();

    return () => {
      isMounted = false;
    };
  }, [isOpen, postId]);

  async function handleSubmit() {
    const trimmed = content.trim();

    if (!postId || isSubmitting || trimmed.length === 0) {
      return;
    }

    const parentId = replyTarget?.parentId;

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      const created = await createComment(postId, trimmed, parentId);
      setContent("");
      setReplyTarget(null);

      if (created.parent_id) {
        const replyParentId = created.parent_id;
        setComments((current) => addReply(current, replyParentId, created));
        setExpandedReplyIds((current) => {
          const next = new Set(current);
          next.add(replyParentId);
          return next;
        });
      } else {
        setComments((current) => {
          const next = [created, ...current];
          onCommentCountChange(postId, next.length);
          return next;
        });
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "댓글 작성에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleReply = useCallback((comment: Comment) => {
    setReplyTarget({ nickname: comment.user.nickname, parentId: comment.id });
    setContent(`@${comment.user.nickname} `);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  function handleCancelReply() {
    setReplyTarget(null);
    setContent("");
  }

  const toggleReplies = useCallback((commentId: string) => {
    setExpandedReplyIds((current) => {
      const next = new Set(current);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  }, []);

  const handleToggleLike = useCallback(
    async (commentId: string) => {
      const previousComments = comments;
      const previousLiked = new Set(likedCommentIds);
      const wasLiked = likedCommentIds.has(commentId);

      setErrorMessage("");
      setLikedCommentIds((current) => {
        const next = new Set(current);
        if (wasLiked) {
          next.delete(commentId);
        } else {
          next.add(commentId);
        }
        return next;
      });
      setComments((current) => {
        const target = flattenComments(current).find(
          (comment) => comment.id === commentId,
        );
        const nextCount = Math.max(
          0,
          (target?.likes_count ?? 0) + (wasLiked ? -1 : 1),
        );
        return updateCommentLikes(current, commentId, nextCount);
      });

      try {
        const result = await toggleCommentLike(commentId);
        setLikedCommentIds((current) => {
          const next = new Set(current);
          if (result.liked) {
            next.add(commentId);
          } else {
            next.delete(commentId);
          }
          return next;
        });
        setComments((current) =>
          updateCommentLikes(current, commentId, result.likesCount),
        );
      } catch (error) {
        setComments(previousComments);
        setLikedCommentIds(previousLiked);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "댓글 좋아요 처리에 실패했습니다.",
        );
      }
    },
    [comments, likedCommentIds],
  );

  const handleDelete = useCallback(
    async (commentId: string) => {
      if (!postId) {
        return;
      }

      try {
        setDeletingCommentId(commentId);
        setErrorMessage("");
        await deleteComment(commentId);

        const deletedComment = flattenComments(comments).find(
          (comment) => comment.id === commentId,
        );
        const parentComment = comments.find(
          (comment) => comment.id === commentId,
        );
        const removedIds = parentComment
          ? [commentId, ...parentComment.replies.map((reply) => reply.id)]
          : [commentId];
        const nextComments = removeComment(comments, commentId);

        setComments(nextComments);
        setLikedCommentIds((current) => {
          const next = new Set(current);
          removedIds.forEach((removedId) => next.delete(removedId));
          return next;
        });

        if (deletedComment && deletedComment.parent_id === null) {
          onCommentCountChange(postId, nextComments.length);
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "댓글 삭제에 실패했습니다.",
        );
      } finally {
        setDeletingCommentId(null);
      }
    },
    [comments, onCommentCountChange, postId],
  );

  return {
    comments,
    content,
    currentUserId,
    deletingCommentId,
    errorMessage,
    expandedReplyIds,
    handleCancelReply,
    handleDelete,
    handleReply,
    handleSubmit,
    handleToggleLike,
    inputRef,
    isLoading,
    isSubmitting,
    likedCommentIds,
    replyTarget,
    setContent,
    toggleReplies,
  };
}
