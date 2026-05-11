"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import { Toast } from "@/components/common/Toast";
import { CommentSheet } from "@/components/feed/CommentSheet";
import { PostCard } from "@/components/feed/PostCard";
import { StoryBar } from "@/components/story/StoryBar";
import {
  getFeed,
  getLikedPostIds,
  togglePostLike,
  type FeedPost,
} from "@/features/feed/api";
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
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState("");
  const [commentSheetPostId, setCommentSheetPostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: "",
    type: "success",
  });
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
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

    // 언마운트 이후 상태 업데이트를 막기 위해 isMounted 플래그를 둔다.
    const loadFeed = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getFeed();

        if (!isMounted) {
          return;
        }

        setPosts(result.posts);
        setNextCursor(result.nextCursor);

        const likedIds = await getLikedPostIds(result.posts.map((post) => post.id));

        if (!isMounted) {
          return;
        }

        setLikedPostIds(new Set(likedIds));
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
  }, []);

  const loadMorePosts = useCallback(async () => {
    if (!nextCursor || isLoadingMoreRef.current) {
      return;
    }

    try {
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
      setError(null);

      const result = await getFeed({ cursor: nextCursor });
      const likedIds = await getLikedPostIds(result.posts.map((post) => post.id));

      setPosts((currentPosts) => [...currentPosts, ...result.posts]);
      setNextCursor(result.nextCursor);
      setLikedPostIds((currentLikedPostIds) => {
        const nextLikedPostIds = new Set(currentLikedPostIds);
        likedIds.forEach((postId) => {
          nextLikedPostIds.add(postId);
        });
        return nextLikedPostIds;
      });
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
  }, [nextCursor]);

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
      const wasLiked = likedPostIds.has(postId);
      const previousPost = posts.find((post) => post.id === postId);

      if (!previousPost) {
        return;
      }

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
      }
    },
    [likedPostIds, posts],
  );

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

  return (
    <>
      <StoryBar />
      <section className="flex flex-1 flex-col px-4 py-4 sm:px-6">
        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
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
                isLiked={likedPostIds.has(post.id)}
                onLike={handleLike}
                onComment={(postId) => {
                  setCommentSheetPostId(postId);
                }}
                onDelete={handleDeletePost}
                onBookmark={(postId) => {
                  console.log("bookmark", postId);
                }}
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
