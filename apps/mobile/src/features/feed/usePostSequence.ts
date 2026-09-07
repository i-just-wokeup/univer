import { useCallback, useEffect, useRef, useState } from "react";

import { PAGE_SIZE } from "../../lib/constants/pagination";
import { useSession } from "../../lib/session";
import { getExplorePosts } from "../explore/api";
import {
  getExplorePageCache,
  setExplorePageCache,
  type ExplorePageCacheSnapshot,
} from "../explore/page-cache";
import type { ExplorePost } from "../explore/types";
import { getProfilePosts } from "../profile/api";
import {
  getBookmarkedPostIds,
  getLikedPostIds,
  getPostsByIds,
} from "./api";
import type { FeedPost } from "./types";
import { useHomeFeedActions } from "./useHomeFeedActions";
import { useHomeFeedFeedback } from "./useHomeFeedFeedback";

export type PostSequenceSource = "explore" | "profile";

type UsePostSequenceParams = {
  postId: string;
  profileUserId?: string;
  source: PostSequenceSource;
};

type LoadedSequence = {
  bookmarkedPostIds: string[];
  likedPostIds: string[];
  posts: FeedPost[];
};

function isReadySequencePost(post: FeedPost) {
  const hasVideo = post.media.some((media) => media.type === "video");

  return (
    !hasVideo ||
    (post.media.length > 0 &&
      post.media.every((media) => media.processing_status === "ready"))
  );
}

function sliceFromPost<T extends { id: string }>(items: T[], postId: string) {
  const startIndex = items.findIndex((item) => item.id === postId);
  return startIndex >= 0 ? items.slice(startIndex) : items;
}

async function hydrateSequencePosts(postIds: string[]): Promise<LoadedSequence> {
  const loadedPosts = (await getPostsByIds(postIds)).filter(
    isReadySequencePost,
  );
  const loadedPostIds = loadedPosts.map((post) => post.id);
  const [likedPostIds, bookmarkedPostIds] = await Promise.all([
    getLikedPostIds(loadedPostIds),
    getBookmarkedPostIds(loadedPostIds),
  ]);

  return { bookmarkedPostIds, likedPostIds, posts: loadedPosts };
}

async function getExploreSnapshot(
  currentUserId: string,
): Promise<ExplorePageCacheSnapshot> {
  // 탐색 화면에 이미 보인 목록은 TTL이 지났어도 다시 조회하지 않고 그대로 이어 쓴다.
  const cached = getExplorePageCache(currentUserId, { allowStale: true });

  if (cached) {
    return cached;
  }

  const result = await getExplorePosts({ limit: PAGE_SIZE.explore, offset: 0 });
  const snapshot = {
    cachedAt: Date.now(),
    hasMore: result.hasMore,
    offset: PAGE_SIZE.explore,
    posts: result.posts,
  };

  setExplorePageCache({
    hasMore: snapshot.hasMore,
    offset: snapshot.offset,
    posts: snapshot.posts,
    userId: currentUserId,
  });

  return snapshot;
}

// 탐색/프로필에서 선택한 게시물부터 이어지는 카드 목록과 상호작용 상태를 관리한다.
// 홈의 post_impressions 경로는 의도적으로 사용하지 않는다.
export function usePostSequence({
  postId,
  profileUserId,
  source,
}: UsePostSequenceParams) {
  const { session } = useSession();
  const currentUserId = session?.user.id ?? null;
  const { feedback, showFeedback } = useHomeFeedFeedback();
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<string>>(
    new Set(),
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const explorePostsRef = useRef<ExplorePost[]>([]);
  const exploreOffsetRef = useRef(0);
  const hasMoreRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const loadGenerationRef = useRef(0);
  const postsRef = useRef(posts);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const applyLoadedSequence = useCallback((loaded: LoadedSequence) => {
    setPosts(loaded.posts);
    setLikedPostIds(new Set(loaded.likedPostIds));
    setBookmarkedPostIds(new Set(loaded.bookmarkedPostIds));
  }, []);

  const loadInitialSequence = useCallback(async () => {
    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;
    setErrorMessage("");
    setIsInitialLoading(true);
    hasMoreRef.current = false;

    try {
      let loaded: LoadedSequence;

      if (source === "explore") {
        if (!currentUserId) {
          throw new Error("로그인이 필요합니다.");
        }

        const snapshot = await getExploreSnapshot(currentUserId);
        explorePostsRef.current = snapshot.posts;
        exploreOffsetRef.current = snapshot.offset;
        const sequencePosts = sliceFromPost(snapshot.posts, postId).filter(
          (post) => !post.is_video,
        );
        loaded = await hydrateSequencePosts(
          sequencePosts.map((post) => post.id),
        );
        hasMoreRef.current = snapshot.hasMore;

        if (!loaded.posts.some((post) => post.id === postId)) {
          const anchor = await hydrateSequencePosts([postId]);
          const anchorPost = anchor.posts[0];

          if (anchorPost) {
            loaded.posts = [
              anchorPost,
              ...loaded.posts.filter((post) => post.id !== anchorPost.id),
            ];
            loaded.likedPostIds = [
              ...anchor.likedPostIds,
              ...loaded.likedPostIds,
            ];
            loaded.bookmarkedPostIds = [
              ...anchor.bookmarkedPostIds,
              ...loaded.bookmarkedPostIds,
            ];
          }
        }
      } else {
        if (!profileUserId) {
          throw new Error("프로필 정보를 찾을 수 없습니다.");
        }

        const profilePosts = await getProfilePosts(profileUserId);
        const sequencePosts = sliceFromPost(profilePosts, postId);
        loaded = await hydrateSequencePosts(
          sequencePosts.map((post) => post.id),
        );
      }

      if (!loaded.posts.some((post) => post.id === postId)) {
        throw new Error("게시물을 찾을 수 없습니다.");
      }

      if (loadGenerationRef.current !== generation) {
        return;
      }

      applyLoadedSequence(loaded);
    } catch (error) {
      if (loadGenerationRef.current !== generation) {
        return;
      }

      setPosts([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "게시물을 불러오지 못했습니다.",
      );
    } finally {
      if (loadGenerationRef.current === generation) {
        setIsInitialLoading(false);
      }
    }
  }, [applyLoadedSequence, currentUserId, postId, profileUserId, source]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadInitialSequence();
    }, 0);

    return () => {
      clearTimeout(timer);
      loadGenerationRef.current += 1;
    };
  }, [loadInitialSequence]);

  const handleLoadMore = useCallback(async () => {
    if (
      source !== "explore" ||
      !currentUserId ||
      !hasMoreRef.current ||
      isLoadingMoreRef.current
    ) {
      return;
    }

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      let appendedPosts: FeedPost[] = [];
      let appendedLikedIds: string[] = [];
      let appendedBookmarkedIds: string[] = [];

      while (hasMoreRef.current && appendedPosts.length === 0) {
        const result = await getExplorePosts({
          limit: PAGE_SIZE.explore,
          offset: exploreOffsetRef.current,
        });
        exploreOffsetRef.current += PAGE_SIZE.explore;
        hasMoreRef.current = result.hasMore;
        explorePostsRef.current = [...explorePostsRef.current, ...result.posts];
        setExplorePageCache({
          hasMore: result.hasMore,
          offset: exploreOffsetRef.current,
          posts: explorePostsRef.current,
          userId: currentUserId,
        });

        const currentIds = new Set(postsRef.current.map((post) => post.id));
        const nextPhotoIds = result.posts
          .filter((post) => !post.is_video && !currentIds.has(post.id))
          .map((post) => post.id);
        const loaded = await hydrateSequencePosts(nextPhotoIds);
        appendedPosts = loaded.posts;
        appendedLikedIds = loaded.likedPostIds;
        appendedBookmarkedIds = loaded.bookmarkedPostIds;
      }

      if (appendedPosts.length > 0) {
        setPosts((current) => [...current, ...appendedPosts]);
        setLikedPostIds(
          (current) => new Set([...current, ...appendedLikedIds]),
        );
        setBookmarkedPostIds(
          (current) => new Set([...current, ...appendedBookmarkedIds]),
        );
      }

    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "게시물을 더 불러오지 못했습니다.",
      );
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [currentUserId, source]);

  const {
    handleBlockUser,
    handleCommentCountChange,
    handleDeletePost,
    handleReportPost,
    handleToggleBookmark,
    handleToggleLike,
  } = useHomeFeedActions({
    bookmarkedPostIds,
    likedPostIds,
    posts,
    setBookmarkedPostIds,
    setErrorMessage,
    setLikedPostIds,
    setPosts,
    showFeedback,
  });

  return {
    bookmarkedPostIds,
    errorMessage,
    feedback,
    handleBlockUser,
    handleCommentCountChange,
    handleDeletePost,
    handleLoadMore,
    handleReportPost,
    handleToggleBookmark,
    handleToggleLike,
    isInitialLoading,
    isLoadingMore,
    likedPostIds,
    posts,
    retry: loadInitialSequence,
    showFeedback,
  };
}
