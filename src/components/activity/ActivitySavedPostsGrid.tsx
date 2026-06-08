import { Heart, MessageCircle } from "lucide-react";

import type { ActivityPost } from "@/features/activity/api";

import { ActivityEmptyState } from "./ActivityEmptyState";

type ActivitySavedPostsGridProps = {
  emptyMessage?: string;
  onOpenPost: (postId: string) => void;
  posts: ActivityPost[];
};

export function ActivitySavedPostsGrid({
  emptyMessage = "아직 저장한 게시물이 없습니다.",
  onOpenPost,
  posts,
}: ActivitySavedPostsGridProps) {
  if (posts.length === 0) {
    return <ActivityEmptyState message={emptyMessage} />;
  }

  return (
    <section className="grid grid-cols-3 gap-px bg-white px-4 py-4">
      {posts.map((post) => {
        const thumbnail = post.media[0];

        return (
          <button
            key={post.id}
            type="button"
            onClick={() => onOpenPost(post.id)}
            className="group relative aspect-square overflow-hidden bg-zinc-100 text-left"
          >
            {thumbnail ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnail.thumbnail_url ?? thumbnail.url}
                  alt={`${post.user.nickname} 게시물`}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-semibold text-zinc-400">
                텍스트 게시물
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-2 text-[11px] font-bold text-white">
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3 w-3" aria-hidden="true" />
                {post.likes_count}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3 w-3" aria-hidden="true" />
                {post.comments_count}
              </span>
            </div>
          </button>
        );
      })}
    </section>
  );
}
