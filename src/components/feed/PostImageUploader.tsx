"use client";

import Image from "next/image";
import { useEffect, useId, useMemo } from "react";

// 선택된 File 배열은 상위 페이지 상태를 그대로 주입받는다.
type PostImageUploaderProps = {
  images: File[];
  onImagesChange: (images: File[]) => void;
};

// 미리보기 렌더링에 필요한 최소 정보.
type PreviewImage = {
  fileName: string;
  url: string;
};

// MVP 기준 최대 업로드 개수 제한.
const MAX_IMAGE_COUNT = 10;

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
  images,
  onImagesChange,
}: PostImageUploaderProps) {
  const inputId = useId();
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

    const nextImages = [...images, ...selectedImages].slice(0, MAX_IMAGE_COUNT);
    onImagesChange(nextImages);
    event.target.value = "";
  }

  // 선택된 이미지 중 한 장만 제거한다.
  function handleImageRemove(indexToRemove: number) {
    onImagesChange(images.filter((_, index) => index !== indexToRemove));
  }

  const isMaxReached = images.length >= MAX_IMAGE_COUNT;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">사진</h2>
          <p className="mt-1 text-xs text-zinc-500">
            여러 장 선택 가능, 최대 10장
          </p>
        </div>
        <span className="text-xs font-medium text-zinc-500">
          {images.length}/{MAX_IMAGE_COUNT}
        </span>
      </div>

      <label
        htmlFor={inputId}
        className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-5 py-8 text-center transition ${
          isMaxReached
            ? "border-zinc-200 bg-zinc-100 text-zinc-400"
            : "border-zinc-300 bg-zinc-50 text-zinc-600 hover:border-zinc-950 hover:bg-white hover:text-zinc-950"
        }`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
          <PlusIcon />
        </span>
        <span className="mt-4 text-sm font-medium">
          {isMaxReached ? "사진은 최대 10장까지 선택할 수 있습니다" : "사진 선택"}
        </span>
        <span className="mt-1 text-xs text-zinc-500">
          JPG, PNG 등 이미지 파일만 업로드하세요
        </span>
      </label>

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
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {previewImages.map((previewImage, index) => (
            <div
              key={`${previewImage.fileName}-${index}`}
              className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100"
            >
              <Image
                src={previewImage.url}
                alt={previewImage.fileName}
                fill
                unoptimized
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => handleImageRemove(index)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                aria-label={`${previewImage.fileName} 삭제`}
              >
                <CloseIcon />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
