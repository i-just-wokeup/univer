"use client";

import { ImageIcon } from "lucide-react";
import { useState } from "react";

import type { AdminApplicantMedia } from "@/features/admin/api";

type PromotionPostMediaViewerProps = {
  media: AdminApplicantMedia[];
};

export function PromotionPostMediaViewer({
  media,
}: PromotionPostMediaViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMedia = media[activeIndex] ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-black">
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {activeMedia ? (
          <MediaContent media={activeMedia} />
        ) : (
          <div className="flex flex-col items-center gap-3 text-zinc-500">
            <ImageIcon className="h-10 w-10" />
            <span className="text-sm font-medium">게시물 미디어가 없습니다.</span>
          </div>
        )}
      </div>

      {media.length > 1 ? (
        <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-white/10 bg-black p-3">
          {media.map((item, index) => {
            const thumbnailUrl =
              item.type === "video" ? item.thumbnailUrl : item.url;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`${index + 1}번째 미디어 보기`}
                className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  index === activeIndex
                    ? "border-white"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                {thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center bg-zinc-900 text-xs text-zinc-500">
                    영상
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function MediaContent({ media }: { media: AdminApplicantMedia }) {
  const cloudflareVideoUrl =
    media.type === "video" &&
    media.provider === "cloudflare_stream" &&
    media.providerAssetId
      ? `https://iframe.videodelivery.net/${encodeURIComponent(media.providerAssetId)}`
      : null;

  if (cloudflareVideoUrl) {
    return (
      <iframe
        src={cloudflareVideoUrl}
        title="Cloudflare Stream 영상"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="aspect-video max-h-full w-full"
      />
    );
  }

  if (media.type === "video") {
    return (
      <video
        src={media.url}
        controls
        autoPlay
        className="max-h-full max-w-full"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={media.url}
      alt="게시물 이미지"
      className="max-h-full max-w-full object-contain"
    />
  );
}
