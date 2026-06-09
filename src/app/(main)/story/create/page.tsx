"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  VisibilityPicker,
  type Visibility,
} from "@/components/common/VisibilityPicker";
import { createStory, uploadStoryImage } from "@/features/stories/api";

export default function StoryCreatePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setError(null);
    setSelectedImage(file);

    if (file) {
      previewUrlRef.current = URL.createObjectURL(file);
      setPreviewUrl(previewUrlRef.current);
    } else {
      setPreviewUrl(null);
    }
  }

  async function handleShare() {
    if (!selectedImage) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const imageUrl = await uploadStoryImage(selectedImage);
      await createStory(imageUrl, visibility);

      router.replace("/?toast=story_posted");
    } catch (shareError) {
      setError(
        shareError instanceof Error
          ? shareError.message
          : "스토리 공유에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-zinc-950 text-white">
      <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-medium text-zinc-200 transition hover:text-white"
          >
            취소
          </button>
          <h1 className="text-base font-semibold">새 스토리</h1>
          <div className="w-9" aria-hidden="true" />
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4 pb-6">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative flex min-h-[calc(100vh-10rem)] flex-1 items-center justify-center overflow-hidden rounded-[2rem] bg-zinc-900"
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="스토리 미리보기"
              className="h-full max-h-[calc(100vh-10rem)] w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl font-light text-zinc-950">
                +
              </div>
              <p className="text-sm font-medium text-zinc-300">
                공유할 사진을 선택하세요
              </p>
            </div>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        <div className="mt-4">
          <VisibilityPicker
            theme="dark"
            value={visibility}
            onChange={setVisibility}
          />
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-medium text-red-200">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleShare}
          disabled={!selectedImage || isSubmitting}
          className="mt-4 rounded-full bg-white px-5 py-4 text-sm font-bold text-zinc-950 transition disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {isSubmitting ? "공유 중..." : "공유하기"}
        </button>
      </main>
    </div>
  );
}
