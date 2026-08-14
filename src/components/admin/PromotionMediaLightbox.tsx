"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import type { AdminApplicantMedia } from "@/features/admin/api";

type PromotionMediaLightboxProps = {
  media: AdminApplicantMedia | null;
  onClose: () => void;
};

export function PromotionMediaLightbox({
  media,
  onClose,
}: PromotionMediaLightboxProps) {
  useEffect(() => {
    if (!media) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [media, onClose]);

  if (!media) {
    return null;
  }

  const cloudflareVideoUrl =
    media.type === "video" &&
    media.provider === "cloudflare_stream" &&
    media.providerAssetId
      ? `https://iframe.videodelivery.net/${encodeURIComponent(media.providerAssetId)}`
      : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="게시물 미디어 크게 보기"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 lg:p-8"
    >
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="미디어 닫기"
      />
      <div className="relative z-10 flex max-h-full w-full max-w-5xl items-center justify-center overflow-hidden rounded-3xl bg-black shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
          aria-label="미디어 닫기"
        >
          <X className="h-5 w-5" />
        </button>

        {cloudflareVideoUrl ? (
          <iframe
            src={cloudflareVideoUrl}
            title="Cloudflare Stream 영상"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="aspect-video max-h-[85vh] w-full"
          />
        ) : media.type === "video" ? (
          <video
            src={media.url}
            controls
            autoPlay
            className="max-h-[85vh] max-w-full"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.url}
            alt="게시물 이미지"
            className="max-h-[85vh] max-w-full object-contain"
          />
        )}
      </div>
    </div>
  );
}
