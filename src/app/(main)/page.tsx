"use client";

import { useEffect, useState } from "react";

import { FeedList } from "@/components/feed/FeedList";
import { StoryBar } from "@/components/story/StoryBar";
import { getFeed, type FeedPost } from "@/features/feed/api";

// 홈 피드 페이지. 현재는 클라이언트에서 피드를 불러와 목록 컴포넌트에 주입한다.
export default function MainPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <>
      {/* 실제 스토리 데이터 연결 전까지는 비어 있는 배열만 전달한다. */}
      <StoryBar stories={[]} />
      <section className="flex flex-1 flex-col px-4 py-4 sm:px-6">
        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}
        <FeedList
          posts={posts}
          isLoading={isLoading}
          // 실제 액션 연결 전까지는 인터랙션 지점만 확인할 수 있게 로그만 남긴다.
          onLike={(postId) => {
            console.log("like", postId);
          }}
          onComment={(postId) => {
            console.log("comment", postId);
          }}
          onBookmark={(postId) => {
            console.log("bookmark", postId);
          }}
        />
      </section>
    </>
  );
}
