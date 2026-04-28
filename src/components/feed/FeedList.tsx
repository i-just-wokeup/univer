import { PostCard } from "@/components/feed/PostCard";
import type { FeedPost } from "@/features/feed/api";

// FeedList는 데이터 주입만 받고, 액션은 상위 페이지에서 제어한다.
type FeedListProps = {
  isLoading?: boolean;
  onBookmark?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onLike?: (postId: string) => void;
  posts: FeedPost[];
};

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

// 피드 목록 컨테이너. 로딩/빈 상태/목록 렌더링만 담당한다.
export function FeedList({
  isLoading = false,
  onBookmark,
  onComment,
  onLike,
  posts,
}: FeedListProps) {
  if (isLoading) {
    return (
      <section className="flex flex-col">
        <FeedCardSkeleton />
        <FeedCardSkeleton />
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section className="flex flex-1 items-center justify-center px-6 py-16">
        <p className="text-sm font-medium text-zinc-500">
          아직 게시물이 없습니다
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={onLike}
          onComment={onComment}
          onBookmark={onBookmark}
        />
      ))}
    </section>
  );
}
