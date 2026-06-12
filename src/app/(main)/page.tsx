"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import { Toast } from "@/components/common/Toast";
import { CommentSheet } from "@/components/feed/CommentSheet";
import { PostCard } from "@/components/feed/PostCard";
import { StoryBar } from "@/components/story/StoryBar";
import {
  getBookmarkedPostIds,
  togglePostBookmark,
} from "@/features/activity/api";
import { blockUser } from "@/features/blocks/api";
import {
  getFeed,
  getLikedPostIds,
  togglePostLike,
  type FeedPost,
} from "@/features/feed/api";
import {
  getFeedPageCache,
  setFeedPageCache,
} from "@/features/feed/page-cache";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

// 실제 데이터가 오기 전 카드 높이를 유지해 레이아웃 점프를 줄인다.
function FeedCardSkeleton() {
  return (
    <div className="animate-pulse border-b border-zinc-200 bg-white px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-zinc-200" />
        <div className="flex-1">
          <div className="h-4 w-28 rounded-full bg-zinc-200" />
          <div className="mt-2 h-3 w-20 rounded-full bg-zinc-100" />
        </div>
      </div>
      <div className="mt-4 aspect-square rounded-3xl bg-zinc-100" />
      <div className="mt-4 flex gap-3">
        <div className="h-5 w-16 rounded-full bg-zinc-100" />
        <div className="h-5 w-16 rounded-full bg-zinc-100" />
      </div>
      <div className="mt-4 h-4 w-full rounded-full bg-zinc-100" />
      <div className="mt-2 h-4 w-2/3 rounded-full bg-zinc-100" />
    </div>
  );
}

type ToastState = {
  isVisible: boolean;
  message: string;
  type: "success" | "error";
};

// 홈 피드 페이지. 현재는 클라이언트에서 피드를 불러와 목록 컴포넌트에 주입한다.
function MainPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<FeedPost[]>(
    () => getFeedPageCache()?.posts ?? [],
  );
  const [nextCursor, setNextCursor] = useState<string | null>(
    () => getFeedPageCache()?.nextCursor ?? null,
  );
  const [isLoading, setIsLoading] = useState(
    () => getFeedPageCache() === null,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<string>>(
    () => new Set(getFeedPageCache()?.bookmarkedPostIds ?? []),
  );
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(
    () => new Set(getFeedPageCache()?.likedPostIds ?? []),
  );
  const [currentUserId, setCurrentUserId] = useState("");
  const [commentSheetPostId, setCommentSheetPostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: "",
    type: "success",
  });
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const pendingLikePostIdsRef = useRef<Set<string>>(new Set());
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    const toastParam = searchParams.get("toast");
    const toastMessage =
      toastParam === "posted"
        ? "게시물이 등록됐습니다"
        : toastParam === "updated"
          ? "게시물이 수정됐습니다"
          : toastParam === "story_posted"
            ? "스토리가 공유됐습니다"
            : null;

    if (!toastMessage) {
      return;
    }

    const toastTimer = window.setTimeout(() => {
      setToast({
        isVisible: true,
        message: toastMessage,
        type: "success",
      });
      router.replace("/");
    }, 0);

    return () => {
      window.clearTimeout(toastTimer);
    };
  }, [router, searchParams]);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUserId = async () => {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isMounted) {
        setCurrentUserId(user?.id ?? "");
      }
    };

    void loadCurrentUserId();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const shouldUseCache = !searchParams.get("toast");

    // 언마운트 이후 상태 업데이트를 막기 위해 isMounted 플래그를 둔다.
    const loadFeed = async () => {
      if (shouldUseCache && getFeedPageCache()) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await getFeed({ includeHashtags: false });

        if (!isMounted) {
          return;
        }

        setPosts(result.posts);
        setNextCursor(result.nextCursor);
        setIsLoading(false);
        setFeedPageCache({
          bookmarkedPostIds: [],
          likedPostIds: [],
          nextCursor: result.nextCursor,
          posts: result.posts,
        });

        const postIds = result.posts.map((post) => post.id);
        const [bookmarkedIds, likedIds] = await Promise.all([
          getBookmarkedPostIds(postIds),
          getLikedPostIds(postIds),
        ]);

        if (!isMounted) {
          return;
        }

        setBookmarkedPostIds(new Set(bookmarkedIds));
        setLikedPostIds(new Set(likedIds));
        setFeedPageCache({
          bookmarkedPostIds: bookmarkedIds,
          likedPostIds: likedIds,
          nextCursor: result.nextCursor,
          posts: result.posts,
        });
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : "피드를 불러오지 못했습니다.";

        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadFeed();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setFeedPageCache({
      bookmarkedPostIds: Array.from(bookmarkedPostIds),
      likedPostIds: Array.from(likedPostIds),
      nextCursor,
      posts,
    });
  }, [bookmarkedPostIds, isLoading, likedPostIds, nextCursor, posts]);

  const loadMorePosts = useCallback(async () => {
    if (!nextCursor || isLoadingMoreRef.current) {
      return;
    }

    try {
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
      setError(null);

      const result = await getFeed({
        cursor: nextCursor,
        includeHashtags: false,
      });
      const postIds = result.posts.map((post) => post.id);
      const [bookmarkedIds, likedIds] = await Promise.all([
        getBookmarkedPostIds(postIds),
        getLikedPostIds(postIds),
      ]);
      const nextPosts = [...posts, ...result.posts];
      const nextBookmarkedPostIds = new Set(bookmarkedPostIds);
      bookmarkedIds.forEach((postId) => {
        nextBookmarkedPostIds.add(postId);
      });
      const nextLikedPostIds = new Set(likedPostIds);
      likedIds.forEach((postId) => {
        nextLikedPostIds.add(postId);
      });

      setPosts(nextPosts);
      setNextCursor(result.nextCursor);
      setBookmarkedPostIds(nextBookmarkedPostIds);
      setLikedPostIds(nextLikedPostIds);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "피드를 더 불러오지 못했습니다.";

      setError(message);
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [bookmarkedPostIds, likedPostIds, nextCursor, posts]);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !nextCursor) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMorePosts();
        }
      },
      {
        rootMargin: "240px 0px",
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [loadMorePosts, nextCursor]);

  const handleLike = useCallback(
    async (postId: string) => {
      if (pendingLikePostIdsRef.current.has(postId)) {
        return;
      }

      const wasLiked = likedPostIds.has(postId);
      const previousPost = posts.find((post) => post.id === postId);

      if (!previousPost) {
        return;
      }

      pendingLikePostIdsRef.current.add(postId);

      const optimisticLikesCount = Math.max(
        0,
        previousPost.likes_count + (wasLiked ? -1 : 1),
      );

      setLikedPostIds((currentLikedPostIds) => {
        const nextLikedPostIds = new Set(currentLikedPostIds);

        if (wasLiked) {
          nextLikedPostIds.delete(postId);
        } else {
          nextLikedPostIds.add(postId);
        }

        return nextLikedPostIds;
      });
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? { ...post, likes_count: optimisticLikesCount }
            : post,
        ),
      );

      try {
        const result = await togglePostLike(postId);

        setLikedPostIds((currentLikedPostIds) => {
          const nextLikedPostIds = new Set(currentLikedPostIds);

          if (result.liked) {
            nextLikedPostIds.add(postId);
          } else {
            nextLikedPostIds.delete(postId);
          }

          return nextLikedPostIds;
        });
        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post.id === postId
              ? { ...post, likes_count: result.likesCount }
              : post,
          ),
        );
      } catch (likeError) {
        setLikedPostIds((currentLikedPostIds) => {
          const nextLikedPostIds = new Set(currentLikedPostIds);

          if (wasLiked) {
            nextLikedPostIds.add(postId);
          } else {
            nextLikedPostIds.delete(postId);
          }

          return nextLikedPostIds;
        });
        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post.id === postId
              ? { ...post, likes_count: previousPost.likes_count }
              : post,
          ),
        );

        const message =
          likeError instanceof Error
            ? likeError.message
            : "좋아요 처리에 실패했습니다.";

        setError(message);
      } finally {
        pendingLikePostIdsRef.current.delete(postId);
      }
    },
    [likedPostIds, posts],
  );

  const handleBookmark = useCallback(
    async (postId: string) => {
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
        const result = await togglePostBookmark(postId);

        setBookmarkedPostIds((currentBookmarkedPostIds) => {
          const nextBookmarkedPostIds = new Set(currentBookmarkedPostIds);

          if (result.bookmarked) {
            nextBookmarkedPostIds.add(postId);
          } else {
            nextBookmarkedPostIds.delete(postId);
          }

          return nextBookmarkedPostIds;
        });
      } catch (bookmarkError) {
        setBookmarkedPostIds((currentBookmarkedPostIds) => {
          const nextBookmarkedPostIds = new Set(currentBookmarkedPostIds);

          if (wasBookmarked) {
            nextBookmarkedPostIds.add(postId);
          } else {
            nextBookmarkedPostIds.delete(postId);
          }

          return nextBookmarkedPostIds;
        });

        const message =
          bookmarkError instanceof Error
            ? bookmarkError.message
            : "게시물 저장 처리에 실패했습니다.";

        setError(message);
      }
    },
    [bookmarkedPostIds],
  );

  const handleBlockUser = useCallback(async (userId: string) => {
    await blockUser(userId);
    setPosts((currentPosts) =>
      currentPosts.filter((post) => post.user.id !== userId),
    );
  }, []);

  const handleCommentCountChange = useCallback(
    (postId: string, nextCount: number) => {
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? { ...post, comments_count: Math.max(0, nextCount) }
            : post,
        ),
      );
    },
    [],
  );

  const handleDeletePost = useCallback((postId: string) => {
    setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));
  }, []);

  const handleOpenComments = useCallback(
    (postId: string) => {
      if (window.matchMedia("(max-width: 1023px)").matches) {
        setCommentSheetPostId(postId);
        return;
      }

      router.push(`/posts/${postId}`);
    },
    [router],
  );

  return (
    <>
      <StoryBar />
      <section className="flex flex-1 flex-col px-0 py-4 sm:px-6">
        {error ? (
          <div className="mx-4 mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 sm:mx-0">
            {error}
          </div>
        ) : null}
        {isLoading ? (
          <section className="flex flex-col">
            <FeedCardSkeleton />
            <FeedCardSkeleton />
          </section>
        ) : null}

        {!isLoading && posts.length === 0 ? (
          <section className="flex flex-1 items-center justify-center px-6 py-16">
            <p className="text-sm font-medium text-zinc-500">
              아직 게시물이 없습니다
            </p>
          </section>
        ) : null}

        {!isLoading && posts.length > 0 ? (
          <section className="flex flex-col">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                isBookmarked={bookmarkedPostIds.has(post.id)}
                isLiked={likedPostIds.has(post.id)}
                onBlockUser={handleBlockUser}
                onLike={handleLike}
                onComment={handleOpenComments}
                onDelete={handleDeletePost}
                onBookmark={handleBookmark}
              />
            ))}
            {isLoadingMore ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm font-medium text-zinc-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-500" />
                <span>더 불러오는 중...</span>
              </div>
            ) : null}
          </section>
        ) : null}
        <div ref={loadMoreRef} className="h-px w-full" aria-hidden="true" />
      </section>
      {/* [앱 재사용 예정] Expo 전환 시 댓글 바텀시트로 사용. 모바일 피드에서는 상세 페이지 이동 없이 댓글만 빠르게 연다. */}
      <CommentSheet
        postId={commentSheetPostId}
        isOpen={commentSheetPostId !== null}
        onClose={() => {
          setCommentSheetPostId(null);
        }}
        onCommentCountChange={handleCommentCountChange}
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
    </>
  );
}

export default function MainPage() {
  return (
    <Suspense fallback={null}>
      <MainPageContent />
    </Suspense>
  );
}
