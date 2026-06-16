"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState } from "react";

import { getPostAspectRatioClass } from "@/components/feed/postAspectRatio";
import type { PostAspectRatio } from "@/features/feed/api";

// 선택된 File 배열은 상위 페이지 상태를 그대로 주입받는다.
type PostImageUploaderProps = {
  aspectRatio: PostAspectRatio;
  images: File[];
  onAspectRatioDetected?: (aspectRatio: PostAspectRatio) => void;
  onImagesChange: (images: File[]) => void;
};

// 미리보기 렌더링에 필요한 최소 정보.
type PreviewImage = {
  fileName: string;
  url: string;
};

// MVP 기준 최대 업로드 개수 제한.
const MAX_IMAGE_COUNT = 10;

function getAspectRatioFromDimensions(
  width: number,
  height: number,
): PostAspectRatio {
  const ratio = width / height;

  if (ratio >= 1.1) {
    return "landscape";
  }

  if (ratio <= 0.9) {
    return "portrait";
  }

  return "square";
}

function detectImageAspectRatio(file: File): Promise<PostAspectRatio> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(getAspectRatioFromDimensions(image.naturalWidth, image.naturalHeight));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지 비율을 확인하지 못했습니다."));
    };
    image.src = objectUrl;
  });
}

// 업로드 추가 버튼 아이콘.
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 개별 이미지 삭제 버튼 아이콘.
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M7 7l10 10M17 7L7 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 게시물 이미지 선택/미리보기/삭제를 담당하는 순수 UI 컴포넌트.
export function PostImageUploader({
  aspectRatio,
  images,
  onAspectRatioDetected,
  onImagesChange,
}: PostImageUploaderProps) {
  const inputId = useId();
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  // File 객체에서 즉시 미리보기 가능한 object URL을 만든다.
  const previewImages = useMemo<PreviewImage[]>(
    () =>
      images.map((image) => ({
        fileName: image.name,
        url: URL.createObjectURL(image),
      })),
    [images],
  );

  // 렌더링마다 만든 object URL은 언마운트 또는 변경 시 정리한다.
  useEffect(() => {
    return () => {
      previewImages.forEach((previewImage) => {
        URL.revokeObjectURL(previewImage.url);
      });
    };
  }, [previewImages]);

  // 기존 배열 뒤에 새 파일을 붙이고 최대 개수까지만 유지한다.
  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedImages = Array.from(event.target.files ?? []);

    if (selectedImages.length === 0) {
      return;
    }

    const shouldDetectAspectRatio = images.length === 0;
    const nextImages = [...images, ...selectedImages].slice(0, MAX_IMAGE_COUNT);
    onImagesChange(nextImages);
    setSelectedPreviewIndex(images.length === 0 ? 0 : selectedPreviewIndex);
    event.target.value = "";

    if (shouldDetectAspectRatio && selectedImages[0]) {
      void detectImageAspectRatio(selectedImages[0])
        .then((detectedAspectRatio) => {
          onAspectRatioDetected?.(detectedAspectRatio);
        })
        .catch(() => {
          // 비율 감지 실패 시 기존 선택값을 유지한다.
        });
    }
  }

  // 선택된 이미지 중 한 장만 제거한다.
  function handleImageRemove(indexToRemove: number) {
    const nextImages = images.filter((_, index) => index !== indexToRemove);
    onImagesChange(nextImages);
    setSelectedPreviewIndex((currentIndex) => {
      if (nextImages.length === 0) {
        return 0;
      }

      if (indexToRemove < currentIndex) {
        return currentIndex - 1;
      }

      if (indexToRemove === currentIndex) {
        return Math.min(currentIndex, nextImages.length - 1);
      }

      return currentIndex;
    });
  }

  const isMaxReached = images.length >= MAX_IMAGE_COUNT;
  const activePreviewIndex =
    previewImages.length > 0
      ? Math.min(selectedPreviewIndex, previewImages.length - 1)
      : 0;
  const selectedPreviewImage = previewImages[activePreviewIndex] ?? null;
  const aspectRatioClass = getPostAspectRatioClass(aspectRatio);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">미디어</h2>
          <p className="mt-1 text-xs font-semibold text-krew-muted">
            사진을 여러 장 선택할 수 있습니다. 최대 10장
          </p>
        </div>
        <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-extrabold text-krew-muted shadow-sm">
          {images.length}/{MAX_IMAGE_COUNT}
        </span>
      </div>

      {selectedPreviewImage ? (
        <div
          className={`relative mx-auto w-full max-w-[430px] overflow-hidden rounded-[22px] bg-zinc-100 shadow-[0_18px_40px_rgba(66,43,102,0.12)] sm:max-w-[440px] ${aspectRatioClass}`}
        >
          <Image
            src={selectedPreviewImage.url}
            alt={selectedPreviewImage.fileName}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 470px"
            priority
          />
          <span className="absolute bottom-3 left-3 rounded-full bg-black/65 px-3 py-1.5 text-xs font-extrabold text-white">
            {activePreviewIndex + 1}/{previewImages.length}
          </span>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={`mx-auto flex min-h-52 w-full max-w-[430px] cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed px-5 py-8 text-center shadow-[var(--krew-card-shadow)] transition sm:max-w-[440px] ${
            isMaxReached
              ? "border-krew-border bg-white/60 text-krew-faint"
              : "border-krew-accent-ring bg-white/80 text-krew-accent hover:border-krew-accent hover:bg-white"
          }`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-krew-accent text-white shadow-[0_14px_28px_rgba(124,58,237,0.24)]">
            <PlusIcon />
          </span>
          <span className="mt-4 text-sm font-extrabold text-foreground">
            {isMaxReached ? "최대 10장까지 선택할 수 있습니다" : "사진 선택"}
          </span>
          <span className="mt-1 text-xs font-semibold text-krew-muted">
            JPG, PNG 등 이미지 파일
          </span>
        </label>
      )}

      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageSelect}
        disabled={isMaxReached}
        className="sr-only"
      />

      {previewImages.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {previewImages.map((previewImage, index) => (
            <div
              key={`${previewImage.fileName}-${index}`}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-[18px] bg-zinc-100 outline outline-offset-[-3px] transition sm:h-24 sm:w-24 ${
                index === activePreviewIndex
                  ? "outline-[3px] outline-krew-accent"
                  : "outline-1 outline-white/80"
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedPreviewIndex(index)}
                className="absolute inset-0"
                aria-label={`${previewImage.fileName} 미리보기`}
                aria-pressed={index === activePreviewIndex}
              >
                <Image
                  src={previewImage.url}
                  alt={previewImage.fileName}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="80px"
                />
              </button>
              <button
                type="button"
                onClick={() => {
                  handleImageRemove(index);
                }}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                aria-label={`${previewImage.fileName} 삭제`}
              >
                <CloseIcon />
              </button>
              <span className="absolute bottom-1 left-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black/65 px-1.5 text-[11px] font-extrabold text-white">
                {index + 1}
              </span>
            </div>
          ))}
          {isMaxReached ? null : (
            <label
              htmlFor={inputId}
              className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-[18px] border border-dashed border-krew-accent-ring bg-white/70 text-krew-accent transition hover:border-krew-accent hover:bg-white sm:h-24 sm:w-24"
              aria-label="사진 추가"
            >
              <PlusIcon />
            </label>
          )}
        </div>
      ) : null}
    </section>
  );
}
