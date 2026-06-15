"use client";

import { Heart } from "lucide-react";
import Image from "next/image";

import { getPostAspectRatioClass } from "@/components/feed/postAspectRatio";
import type { ExplorePost } from "@/features/explore/api";

type ExploreGridProps = {
  onOpenPost: (postId: string) => void;
  posts: ExplorePost[];
};

export function ExploreGrid({ onOpenPost, posts }: ExploreGridProps) {
  return (
    <section className="columns-2 gap-2 [column-fill:_balance]">
      {posts.map((post) => (
        <button
          key={post.id}
          type="button"
          onClick={() => onOpenPost(post.id)}
          className={`group relative mb-2 block w-full break-inside-avoid overflow-hidden rounded-[20px] bg-zinc-100 shadow-[0_12px_26px_rgba(66,43,102,0.09)] ${getPostAspectRatioClass(post.aspect_ratio)}`}
        >
          <Image
            src={post.thumbnail_url}
            alt="탐색 게시물 썸네일"
            fill
            sizes="(max-width: 640px) 50vw, 230px"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/86 px-2 py-1 text-xs font-extrabold text-foreground shadow-sm backdrop-blur">
            <Heart
              className="h-3.5 w-3.5 fill-krew-like text-krew-like"
              aria-hidden="true"
            />
            {post.likes_count}
          </span>
        </button>
      ))}
    </section>
  );
}
