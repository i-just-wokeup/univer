"use client";

import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { PostDetail } from "@/components/feed/PostDetail";

export default function PostDetailPage() {
  const params = useParams<{ postId: string }>();
  const router = useRouter();
  const postId = decodeURIComponent(params.postId);

  return (
    <div className="min-h-screen bg-white pb-24 text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
        <div className="grid h-14 grid-cols-3 items-center px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="justify-self-start"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-6 w-6 text-zinc-800" aria-hidden="true" />
          </button>
          <h1 className="justify-self-center text-base font-bold">게시물</h1>
          <div aria-hidden="true" />
        </div>
      </header>

      <PostDetail postId={postId} />
    </div>
  );
}
