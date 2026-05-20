"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type UIEvent,
} from "react";

import type { PostDetail as FeedPostDetail } from "@/features/feed/api";

export function ImageCarousel({
  isModal = false,
  post,
}: {
  isModal?: boolean;
  post: FeedPostDetail;
}) {
  const carouselId = useId();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<
    Record<string, { height: number; width: number }>
  >({});
  const [viewportSize, setViewportSize] = useState<{
    height: number;
    width: number;
  } | null>(null);
  const hasMultipleImages = post.media.length > 1;
  const currentMedia = post.media[currentImageIndex] ?? null;
  const currentDimensions = currentMedia ? imageDimensions[currentMedia.id] : null;
  const availableModalImageWidth = viewportSize
    ? Math.max(0, viewportSize.width - 500 - 16)
    : 600;
  const modalCarouselWidth = currentDimensions && viewportSize
    ? `${Math.min(
        600,
        availableModalImageWidth,
        viewportSize.height * 0.96 * (currentDimensions.width / currentDimensions.height),
      )}px`
    : "min(600px, calc(100vw - 500px - 1rem))";
  const carouselStyle = isModal
    ? ({
        "--desktop-carousel-width": modalCarouselWidth,
      } as CSSProperties)
    : undefined;

  function handleImageScroll(event: UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;

    if (element.clientWidth === 0) {
      return;
    }

    setCurrentImageIndex(Math.round(element.scrollLeft / element.clientWidth));
  }

  function moveToImage(nextIndex: number) {
    const carousel = carouselRef.current;

    if (!carousel) {
      return;
    }

    carousel.scrollTo({
      behavior: "smooth",
      left: carousel.clientWidth * nextIndex,
    });
    setCurrentImageIndex(nextIndex);
  }

  useEffect(() => {
    if (!isModal) {
      return;
    }

    function updateViewportSize() {
      setViewportSize({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    }

    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);

    return () => {
      window.removeEventListener("resize", updateViewportSize);
    };
  }, [isModal]);

  if (post.media.length === 0) {
    return <div className="aspect-square bg-zinc-100" />;
  }

  return (
    <div
      className={`relative flex h-full min-h-0 w-full flex-col bg-black ${
        isModal ? "lg:w-[var(--desktop-carousel-width)] lg:max-w-[600px]" : ""
      }`}
      style={carouselStyle}
    >
      <div
        id={carouselId}
        ref={carouselRef}
        onScroll={handleImageScroll}
        className={`flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          isModal ? "lg:w-[var(--desktop-carousel-width)] lg:max-w-[600px]" : ""
        }`}
      >
        {post.media.map((image) => (
          <div
            key={image.id}
            className={`flex h-full w-full shrink-0 snap-start items-center justify-center bg-black ${
              isModal ? "lg:w-[var(--desktop-carousel-width)] lg:max-w-[600px]" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={`${post.user.nickname} 게시물 이미지`}
              onLoad={(event) => {
                const element = event.currentTarget;

                setImageDimensions((currentDimensionsById) => {
                  const currentImageDimensions = currentDimensionsById[image.id];

                  if (
                    currentImageDimensions?.height === element.naturalHeight &&
                    currentImageDimensions.width === element.naturalWidth
                  ) {
                    return currentDimensionsById;
                  }

                  return {
                    ...currentDimensionsById,
                    [image.id]: {
                      height: element.naturalHeight,
                      width: element.naturalWidth,
                    },
                  };
                });
              }}
              className={
                isModal
                  ? "h-full w-full object-contain"
                  : "max-h-full w-full object-contain lg:w-auto lg:max-w-full"
              }
            />
          </div>
        ))}
      </div>

      {hasMultipleImages && currentImageIndex > 0 ? (
        <button
          type="button"
          onClick={() => {
            moveToImage(currentImageIndex - 1);
          }}
          className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-sm transition hover:bg-black/60"
          aria-label="이전 이미지"
          aria-controls={carouselId}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : null}

      {hasMultipleImages && currentImageIndex < post.media.length - 1 ? (
        <button
          type="button"
          onClick={() => {
            moveToImage(currentImageIndex + 1);
          }}
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-sm transition hover:bg-black/60"
          aria-label="다음 이미지"
          aria-controls={carouselId}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : null}

      {hasMultipleImages ? (
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/40 px-2 py-1">
          {post.media.map((image, index) => (
            <span
              key={image.id}
              className={`block h-2 w-2 rounded-full ${
                index === currentImageIndex ? "bg-white" : "bg-white/40"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
