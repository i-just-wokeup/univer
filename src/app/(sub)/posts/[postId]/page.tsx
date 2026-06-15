"use client";

import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { PostDetail } from "@/components/feed/PostDetail";

export default function PostDetailPage() {
  const params = useParams<{ postId: string }>();
  const router = useRouter();
  const postId = decodeURIComponent(params.postId);

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      <header className="sticky top-0 z-20 border-b border-krew-border bg-background/95 backdrop-blur">
        <div className="grid h-14 grid-cols-3 items-center px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center justify-self-start rounded-2xl bg-white text-zinc-800 shadow-sm transition hover:text-krew-accent"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="justify-self-center text-base font-black">게시물</h1>
          <div aria-hidden="true" />
        </div>
      </header>

      <PostDetail postId={postId} />
    </div>
  );
}
