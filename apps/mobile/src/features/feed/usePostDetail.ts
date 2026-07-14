import { useCallback, useEffect, useRef, useState } from "react";

import { blockUser } from "../blocks/api";
import {
  deletePost,
  getBookmarkedPostIds,
  getLikedPostIds,
  getPost,
  toggleBookmark,
  togglePostLike,
} from "./api";
import type { FeedPost } from "./types";
import { createReport } from "../reports/api";
import { recordMetric } from "../metrics/api";

// 게시물 상세 로드 + 좋아요/저장/차단/신고/삭제/댓글수/피드백 로직. UI/네비게이션은 화면이 담당.
export function usePostDetail(postId: string) {
  const [post, setPost] = useState<FeedPost | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingBookmarkRef = useRef(false);
  const pendingLikeRef = useRef(false);
  // 상세 조회를 이 화면 마운트 동안 한 번만 기록.
  const viewRecordedRef = useRef(false);

  const showFeedback = useCallback((message: string) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    setFeedbackMessage(message);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackMessage("");
      feedbackTimerRef.current = null;
    }, 1800);
  }, []);

  const load = useCallback(async () => {
    try {
      setErrorMessage("");
      const [loadedPost, likedIds, bookmarkedIds] = await Promise.all([
        getPost(postId),
        getLikedPostIds([postId]),
        getBookmarkedPostIds([postId]),
      ]);
      setPost(loadedPost);
      setIsLiked(likedIds.includes(postId));
      setIsBookmarked(bookmarkedIds.includes(postId));

      // 게시물 조회 기록(본인 것은 서버가 제외).
      if (!viewRecordedRef.current) {
        viewRecordedRef.current = true;
        void recordMetric("post_view", loadedPost.id, loadedPost.user.id);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "게시물을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  function retry() {
    setIsLoading(true);
    void load();
  }

  const handleToggleLike = useCallback(async () => {
    if (pendingLikeRef.current) {
      return;
    }

    pendingLikeRef.current = true;

    try {
      const result = await togglePostLike(postId);
      setPost((current) =>
        current ? { ...current, likes_count: result.likesCount } : current,
      );
      setIsLiked(result.liked);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "좋아요를 처리하지 못했습니다.",
      );
    } finally {
      pendingLikeRef.current = false;
    }
  }, [postId]);

  const handleToggleBookmark = useCallback(async () => {
    if (pendingBookmarkRef.current) {
      return;
    }

    pendingBookmarkRef.current = true;
    const wasBookmarked = isBookmarked;
    setIsBookmarked(!wasBookmarked);

    try {
      const result = await toggleBookmark(postId);
      setIsBookmarked(result.bookmarked);
      showFeedback(result.bookmarked ? "게시물을 저장했어요" : "저장을 취소했어요");
    } catch (error) {
      setIsBookmarked(wasBookmarked);
      showFeedback(
        error instanceof Error ? error.message : "저장을 처리하지 못했습니다.",
      );
    } finally {
      pendingBookmarkRef.current = false;
    }
  }, [isBookmarked, postId, showFeedback]);

  // 차단 성공 시 true 반환(화면 이동은 호출부).
  const blockPostUser = useCallback(
    async (userId: string): Promise<boolean> => {
      try {
        await blockUser(userId);
        showFeedback("차단했어요");
        return true;
      } catch (error) {
        showFeedback(
          error instanceof Error ? error.message : "차단에 실패했습니다.",
        );
        return false;
      }
    },
    [showFeedback],
  );

  const reportPost = useCallback(
    async (reportedPostId: string) => {
      try {
        await createReport({ targetId: reportedPostId, targetType: "post" });
        showFeedback("신고가 접수됐어요");
      } catch (error) {
        showFeedback(
          error instanceof Error ? error.message : "신고에 실패했습니다.",
        );
      }
    },
    [showFeedback],
  );

  // 삭제 성공 시 true 반환(화면 이동은 호출부).
  const deletePostById = useCallback(
    async (deletedPostId: string): Promise<boolean> => {
      try {
        await deletePost(deletedPostId);
        showFeedback("삭제했어요");
        return true;
      } catch (error) {
        showFeedback(
          error instanceof Error ? error.message : "삭제에 실패했습니다.",
        );
        return false;
      }
    },
    [showFeedback],
  );

  const handleCommentCountChange = useCallback(
    (changedPostId: string, nextCount: number) => {
      setPost((current) =>
        current && current.id === changedPostId
          ? { ...current, comments_count: nextCount }
          : current,
      );
    },
    [],
  );

  return {
    blockPostUser,
    deletePostById,
    errorMessage,
    feedbackMessage,
    handleCommentCountChange,
    handleToggleBookmark,
    handleToggleLike,
    isBookmarked,
    isLiked,
    isLoading,
    post,
    reportPost,
    retry,
  };
}
