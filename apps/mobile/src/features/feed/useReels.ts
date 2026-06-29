import { useCallback, useEffect, useRef, useState } from "react";

import {
  getBookmarkedPostIds,
  getLikedPostIds,
  getVideoFeed,
  toggleBookmark,
  togglePostLike,
} from "./api";
import type { FeedPost } from "./types";
import { PAGE_SIZE } from "../../lib/constants/pagination";

// 릴스(영상 전용 세로 피드) 데이터 + 좋아요/저장 + 활성 인덱스(보이는 영상 1개 재생).
// startPostId가 있으면 그 영상이 목록에 포함되도록 우선 로드한다.
export function useReels(startPostId?: string) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const pendingLikeRef = useRef<Set<string>>(new Set());
  const pendingBookmarkRef = useRef<Set<string>>(new Set());

  const loadStatuses = useCallback(async (loadedPosts: FeedPost[]) => {
    const ids = loadedPosts.map((post) => post.id);
    if (ids.length === 0) {
      return;
    }
    try {
      const [liked, bookmarked] = await Promise.all([
        getLikedPostIds(ids),
        getBookmarkedPostIds(ids),
      ]);
      setLikedPostIds((current) => new Set([...current, ...liked]));
      setBookmarkedPostIds((current) => new Set([...current, ...bookmarked]));
    } catch {
      // 좋아요/저장 상태 로딩 실패는 무시(재생은 막지 않음).
    }
  }, []);

  const loadFirstPage = useCallback(async () => {
    try {
      setErrorMessage("");
      const result = await getVideoFeed({ limit: PAGE_SIZE.feed });
      cursorRef.current = result.nextCursor;
      hasMoreRef.current = result.nextCursor !== null;

      // 진입한 영상이 첫 페이지에 있으면 그 위치를 시작 인덱스로.
      const startIndex = startPostId
        ? Math.max(
            0,
            result.posts.findIndex((post) => post.id === startPostId),
          )
        : 0;

      setPosts(result.posts);
      setActiveIndex(startIndex);
      void loadStatuses(result.posts);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "영상을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadStatuses, startPostId]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  async function loadMore() {
    if (!hasMoreRef.current || isLoadingMore || !cursorRef.current) {
      return;
    }
    try {
      setIsLoadingMore(true);
      const result = await getVideoFeed({
        cursor: cursorRef.current,
        limit: PAGE_SIZE.feed,
      });
      cursorRef.current = result.nextCursor;
      hasMoreRef.current = result.nextCursor !== null;
      setPosts((current) => [...current, ...result.posts]);
      void loadStatuses(result.posts);
    } catch {
      // 추가 로딩 실패는 조용히 무시.
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function toggleLike(postId: string) {
    if (pendingLikeRef.current.has(postId)) {
      return;
    }
    pendingLikeRef.current.add(postId);
    try {
      const result = await togglePostLike(postId);
      setLikedPostIds((current) => {
        const next = new Set(current);
        if (result.liked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? { ...post, likes_count: result.likesCount }
            : post,
        ),
      );
    } catch {
      // 좋아요 실패 무시.
    } finally {
      pendingLikeRef.current.delete(postId);
    }
  }

  async function toggleBookmarkPost(postId: string) {
    if (pendingBookmarkRef.current.has(postId)) {
      return;
    }
    pendingBookmarkRef.current.add(postId);
    const wasBookmarked = bookmarkedPostIds.has(postId);
    setBookmarkedPostIds((current) => {
      const next = new Set(current);
      if (wasBookmarked) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
    try {
      const result = await toggleBookmark(postId);
      setBookmarkedPostIds((current) => {
        const next = new Set(current);
        if (result.bookmarked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
    } catch {
      // 실패 시 롤백.
      setBookmarkedPostIds((current) => {
        const next = new Set(current);
        if (wasBookmarked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
    } finally {
      pendingBookmarkRef.current.delete(postId);
    }
  }

  function handleCommentCountChange(postId: string, nextCount: number) {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, comments_count: nextCount } : post,
      ),
    );
  }

  return {
    activeIndex,
    bookmarkedPostIds,
    errorMessage,
    handleCommentCountChange,
    isLoading,
    isLoadingMore,
    likedPostIds,
    loadMore,
    posts,
    setActiveIndex,
    toggleBookmarkPost,
    toggleLike,
  };
}
