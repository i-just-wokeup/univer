"use client";

import { useParams, usePathname, useRouter } from "next/navigation";

import { PostDetail } from "@/components/feed/PostDetail";

export default function PostDetailModalPage() {
  const params = useParams<{ postId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const postId = decodeURIComponent(params.postId);

  if (pathname !== `/posts/${postId}`) {
    return null;
  }

  function handleClose() {
    router.back();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-2 py-2">
      <button
        type="button"
        className="absolute inset-0"
        onClick={handleClose}
        aria-label="게시물 상세 닫기"
      />

      <section className="relative h-[90vh] w-full max-w-6xl overflow-hidden rounded-sm bg-white shadow-2xl">
        <PostDetail postId={postId} onClose={handleClose} />
      </section>
    </div>
  );
}
