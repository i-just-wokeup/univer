"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ExploreGrid } from "@/components/explore/ExploreGrid";
import {
  getExplorePosts,
  type ExplorePost,
} from "@/features/explore/api";
import {
  getExplorePageCache,
  setExplorePageCache,
} from "@/features/explore/page-cache";

const PAGE_SIZE = 24;

function ExploreSkeleton() {
  return (
    <section className="grid animate-pulse grid-cols-3 gap-px bg-white">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="aspect-square bg-zinc-100" />
      ))}
    </section>
  );
}

export default function ExplorePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<ExplorePost[]>(
    () => getExplorePageCache()?.posts ?? [],
  );
  const [isLoading, setIsLoading] = useState(
    () => getExplorePageCache() === null,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(
    () => getExplorePageCache()?.hasMore ?? false,
  );
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(getExplorePageCache()?.offset ?? 0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      if (getExplorePageCache()) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const result = await getExplorePosts({ limit: PAGE_SIZE, offset: 0 });

        if (!isMounted) {
          return;
        }

        setPosts(result.posts);
        setHasMore(result.hasMore);
        offsetRef.current = PAGE_SIZE;
        setExplorePageCache({
          hasMore: result.hasMore,
          offset: offsetRef.current,
          posts: result.posts,
        });
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "탐색 게시물을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitial();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setExplorePageCache({
      hasMore,
      offset: offsetRef.current,
      posts,
    });
  }, [hasMore, isLoading, posts]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const result = await getExplorePosts({
        limit: PAGE_SIZE,
        offset: offsetRef.current,
      });
      const nextPosts = [...posts, ...result.posts];
      const nextOffset = offsetRef.current + PAGE_SIZE;

      setPosts(nextPosts);
      setHasMore(result.hasMore);
      offsetRef.current = nextOffset;
      setExplorePageCache({
        hasMore: result.hasMore,
        offset: nextOffset,
        posts: nextPosts,
      });
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, posts]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  return (
    <div className="min-h-full bg-white">
      {isLoading ? (
        <ExploreSkeleton />
      ) : error ? (
        <section className="flex min-h-60 items-center justify-center px-6 text-center">
          <p className="text-sm font-medium text-zinc-500">{error}</p>
        </section>
      ) : posts.length === 0 ? (
        <section className="flex min-h-60 items-center justify-center px-6 text-center">
          <p className="text-sm font-medium text-zinc-500">
            아직 둘러볼 게시물이 없습니다.
          </p>
        </section>
      ) : (
        <>
          <ExploreGrid
            posts={posts}
            onOpenPost={(postId) => router.push(`/posts/${postId}`)}
          />
          {isLoadingMore ? (
            <p className="py-4 text-center text-xs text-zinc-400">
              불러오는 중...
            </p>
          ) : null}
          <div ref={sentinelRef} className="h-px" />
        </>
      )}
    </div>
  );
}
