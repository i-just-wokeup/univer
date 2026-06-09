"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ExploreGrid } from "@/components/explore/ExploreGrid";
import {
  getExplorePosts,
  type ExplorePost,
} from "@/features/explore/api";

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
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
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
      setPosts((current) => [...current, ...result.posts]);
      setHasMore(result.hasMore);
      offsetRef.current += PAGE_SIZE;
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore]);

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
