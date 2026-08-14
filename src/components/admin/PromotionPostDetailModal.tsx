"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import { PromotionPostDetailSidebar } from "@/components/admin/PromotionPostDetailSidebar";
import { PromotionPostMediaViewer } from "@/components/admin/PromotionPostMediaViewer";
import type {
  AdminApplicantPost,
  AdminPostComment,
  AdminPostInsight,
} from "@/features/admin/api";

type PromotionPostDetailModalProps = {
  comments: AdminPostComment[];
  error: string | null;
  insight: AdminPostInsight | null;
  isLoading: boolean;
  onClose: () => void;
  post: AdminApplicantPost | null;
};

export function PromotionPostDetailModal({
  comments,
  error,
  insight,
  isLoading,
  onClose,
  post,
}: PromotionPostDetailModalProps) {
  useEffect(() => {
    if (!post) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, post]);

  if (!post) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="승격 신청 게시물 상세 검토"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 lg:p-8"
    >
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="게시물 상세 닫기"
      />

      <div className="relative z-10 grid h-[min(860px,calc(100vh-1.5rem))] w-full max-w-7xl grid-rows-[minmax(0,1fr)_minmax(260px,0.8fr)] overflow-hidden rounded-3xl bg-white shadow-2xl lg:h-[min(820px,calc(100vh-4rem))] lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)] lg:grid-rows-1">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/80"
          aria-label="게시물 상세 닫기"
        >
          <X className="h-5 w-5" />
        </button>

        <PromotionPostMediaViewer media={post.media} />
        <PromotionPostDetailSidebar
          comments={comments}
          error={error}
          insight={insight}
          isLoading={isLoading}
          post={post}
        />
      </div>
    </div>
  );
}
