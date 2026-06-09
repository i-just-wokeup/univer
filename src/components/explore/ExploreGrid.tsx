"use client";

import { Heart, MessageCircle } from "lucide-react";

import type { ExplorePost } from "@/features/explore/api";

type ExploreGridProps = {
  onOpenPost: (postId: string) => void;
  posts: ExplorePost[];
};

export function ExploreGrid({ onOpenPost, posts }: ExploreGridProps) {
  return (
    <section className="grid grid-cols-3 gap-px bg-white">
      {posts.map((post) => (
        <button
          key={post.id}
          type="button"
          onClick={() => onOpenPost(post.id)}
          className="group relative aspect-square overflow-hidden bg-zinc-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.thumbnail_url}
            alt="탐색 게시물 썸네일"
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 hidden items-center justify-center gap-4 bg-black/40 text-sm font-bold text-white group-hover:flex">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-4 w-4 fill-white" aria-hidden="true" />
              {post.likes_count}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-4 w-4 fill-white" aria-hidden="true" />
              {post.comments_count}
            </span>
          </span>
        </button>
      ))}
    </section>
  );
}
