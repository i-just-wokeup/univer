import { useCallback, useRef, type Dispatch, type SetStateAction } from "react";

import { blockUser } from "../blocks/api";
import { createReport } from "../reports/api";
import {
  deletePost,
  toggleBookmark,
  togglePostLike,
} from "./api";
import type { FeedPost } from "./types";
import type { HomeFeedbackType } from "./useHomeFeedFeedback";

type UseHomeFeedActionsParams = {
  bookmarkedPostIds: Set<string>;
  posts: FeedPost[];
  setBookmarkedPostIds: Dispatch<SetStateAction<Set<string>>>;
  setErrorMessage: Dispatch<SetStateAction<string>>;
  setLikedPostIds: Dispatch<SetStateAction<Set<string>>>;
  setPosts: Dispatch<SetStateAction<FeedPost[]>>;
  showFeedback: (message: string, type: HomeFeedbackType) => void;
};

export function useHomeFeedActions({
  bookmarkedPostIds,
  posts,
  setBookmarkedPostIds,
  setErrorMessage,
  setLikedPostIds,
  setPosts,
  showFeedback,
}: UseHomeFeedActionsParams) {
  const pendingBookmarkPostIdsRef = useRef<Set<string>>(new Set());
  const pendingLikePostIdsRef = useRef<Set<string>>(new Set());

  async function handleToggleLike(postId: string) {
    if (pendingLikePostIdsRef.current.has(postId)) {
      return;
    }

    pendingLikePostIdsRef.current.add(postId);

    try {
      const result = await togglePostLike(postId);

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId ? { ...post, likes_count: result.likesCount } : post,
        ),
      );
      setLikedPostIds((currentLikedPostIds) => {
        const nextLikedPostIds = new Set(currentLikedPostIds);

        if (result.liked) {
          nextLikedPostIds.add(postId);
        } else {
          nextLikedPostIds.delete(postId);
        }
        return nextLikedPostIds;
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "좋아요를 처리하지 못했습니다.",
      );
    } finally {
      pendingLikePostIdsRef.current.delete(postId);
    }
  }

  async function handleToggleBookmark(postId: string) {
    if (pendingBookmarkPostIdsRef.current.has(postId)) {
      return;
    }

    pendingBookmarkPostIdsRef.current.add(postId);
    const wasBookmarked = bookmarkedPostIds.has(postId);

    setBookmarkedPostIds((currentBookmarkedPostIds) => {
      const nextBookmarkedPostIds = new Set(currentBookmarkedPostIds);

      if (wasBookmarked) {
        nextBookmarkedPostIds.delete(postId);
      } else {
        nextBookmarkedPostIds.add(postId);
      }

      return nextBookmarkedPostIds;
    });

    try {
      const result = await toggleBookmark(postId);

      setBookmarkedPostIds((currentBookmarkedPostIds) => {
        const nextBookmarkedPostIds = new Set(currentBookmarkedPostIds);

        if (result.bookmarked) {
          nextBookmarkedPostIds.add(postId);
        } else {
          nextBookmarkedPostIds.delete(postId);
        }

        return nextBookmarkedPostIds;
      });
      showFeedback(result.bookmarked ? "게시물을 저장했어요" : "저장을 취소했어요", "success");
    } catch (error) {
      setBookmarkedPostIds((currentBookmarkedPostIds) => {
        const nextBookmarkedPostIds = new Set(currentBookmarkedPostIds);

        if (wasBookmarked) {
          nextBookmarkedPostIds.add(postId);
        } else {
          nextBookmarkedPostIds.delete(postId);
        }

        return nextBookmarkedPostIds;
      });
      showFeedback(
        error instanceof Error ? error.message : "저장을 처리하지 못했습니다.",
        "error",
      );
    } finally {
      pendingBookmarkPostIdsRef.current.delete(postId);
    }
  }

  async function handleBlockUser(userId: string) {
    try {
      await blockUser(userId);
      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.user.id !== userId),
      );
      showFeedback("차단했어요", "success");
    } catch (error) {
      showFeedback(
        error instanceof Error ? error.message : "차단에 실패했습니다.",
        "error",
      );
    }
  }

  async function handleReportPost(postId: string) {
    try {
      await createReport({ targetId: postId, targetType: "post" });
      showFeedback("신고가 접수됐어요", "success");
    } catch (error) {
      showFeedback(
        error instanceof Error ? error.message : "신고에 실패했습니다.",
        "error",
      );
    }
  }

  async function handleDeletePost(postId: string) {
    const previousPosts = posts;

    setPosts((currentPosts) =>
      currentPosts.filter((post) => post.id !== postId),
    );

    try {
      await deletePost(postId);
      showFeedback("삭제했어요", "success");
    } catch (error) {
      setPosts(previousPosts);
      showFeedback(
        error instanceof Error ? error.message : "삭제에 실패했습니다.",
        "error",
      );
    }
  }

  const handleCommentCountChange = useCallback(
    (postId: string, nextCount: number) => {
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId ? { ...post, comments_count: nextCount } : post,
        ),
      );
    },
    [setPosts],
  );

  return {
    handleBlockUser,
    handleCommentCountChange,
    handleDeletePost,
    handleReportPost,
    handleToggleBookmark,
    handleToggleLike,
  };
}
