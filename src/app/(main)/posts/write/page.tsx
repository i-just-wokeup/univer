"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PostImageUploader } from "@/components/feed/PostImageUploader";
import {
  createPost,
  getCurrentUserUniversityId,
  uploadPostImages,
} from "@/features/feed/api";

// MVP에서는 공개/친한친구 두 범위만 고려하지만 현재 UI는 public으로 고정한다.
type Visibility = "public" | "close_friends";

// 입력된 해시태그 문자열을 저장 가능한 기본 형태로 정리한다.
function normalizeHashtag(value: string) {
  return value.trim().replace(/^#+/, "").replace(/\s+/g, "");
}

// 게시물 작성 페이지. 업로드와 저장 orchestration만 담당한다.
export default function PostWritePage() {
  const router = useRouter();
  const [images, setImages] = useState<File[]>([]);
  const [content, setContent] = useState("");
  const [visibility] = useState<Visibility>("public");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 한 번에 여러 개 입력된 해시태그를 분리하고, 중복 없는 배열로 합친다.
  function appendHashtags(rawValue: string) {
    const nextTags = rawValue
      .split("#")
      .map(normalizeHashtag)
      .filter(Boolean);

    if (nextTags.length === 0) {
      return;
    }

    setHashtags((currentTags) => {
      const mergedTags = [...currentTags];

      nextTags.forEach((tag) => {
        if (!mergedTags.includes(tag)) {
          mergedTags.push(tag);
        }
      });

      return mergedTags;
    });
  }

  // 공백 입력 시 즉시 태그를 확정한다.
  function handleHashtagInputChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const nextValue = event.target.value;

    if (nextValue.includes(" ")) {
      appendHashtags(nextValue);
      setHashtagInput("");
      return;
    }

    setHashtagInput(nextValue);
  }

  // 엔터/쉼표/탭으로도 태그를 확정할 수 있게 처리한다.
  function handleHashtagKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (
      event.key !== "Enter" &&
      event.key !== "," &&
      event.key !== "Tab"
    ) {
      return;
    }

    event.preventDefault();

    if (!hashtagInput.trim()) {
      return;
    }

    appendHashtags(hashtagInput);
    setHashtagInput("");
  }

  // 포커스를 잃을 때 남아 있는 입력값도 태그로 확정한다.
  function handleHashtagBlur() {
    if (!hashtagInput.trim()) {
      return;
    }

    appendHashtags(hashtagInput);
    setHashtagInput("");
  }

  // 개별 태그 삭제.
  function handleHashtagRemove(tagToRemove: string) {
    setHashtags((currentTags) =>
      currentTags.filter((tag) => tag !== tagToRemove),
    );
  }

  // 현재 유저 학교 조회 → 이미지 업로드 → 게시물 저장 순으로 실행한다.
  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);

    try {
      const { universityId } = await getCurrentUserUniversityId();
      const imageUrls = await uploadPostImages(images);

      await createPost({
        content,
        hashtags,
        imageUrls,
        universityId,
        visibility,
      });

      router.replace("/");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "게시물 저장에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // 본문이나 이미지 둘 다 없으면 빈 게시물 방지를 위해 제출을 막는다.
  const isSubmitDisabled = content.trim().length === 0 && images.length === 0;

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
          >
            취소
          </button>
          <h1 className="text-base font-semibold text-zinc-950">새 게시물</h1>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled || isSubmitting}
            className="text-sm font-semibold text-zinc-950 transition disabled:text-zinc-400"
          >
            {isSubmitting ? "게시 중..." : "게시"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 py-5">
        <PostImageUploader images={images} onImagesChange={setImages} />

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-950">내용</h2>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="무슨 생각을 하고 있나요?"
            className="min-h-32 rounded-3xl border border-zinc-200 px-4 py-4 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950"
          />
        </section>

        {/* <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-950">공개 범위</h2>
          <div className="grid grid-cols-2 gap-2 rounded-3xl bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() => setVisibility("public")}
              className={`rounded-[20px] px-4 py-3 text-sm font-medium transition ${
                visibility === "public"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-500"
              }`}
            >
              전체공개
            </button>
            <button
              type="button"
              onClick={() => setVisibility("close_friends")}
              className={`rounded-[20px] px-4 py-3 text-sm font-medium transition ${
                visibility === "close_friends"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-500"
              }`}
            >
              친한친구만
            </button>
          </div>
        </section> */}

        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950">해시태그</h2>
            <p className="mt-1 text-xs text-zinc-500">
              `#태그` 입력 후 엔터, 탭, 쉼표 또는 공백으로 추가
            </p>
          </div>
          <div className="rounded-3xl border border-zinc-200 px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleHashtagRemove(tag)}
                  className="rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white"
                >
                  #{tag} ×
                </button>
              ))}
              <input
                value={hashtagInput}
                onChange={handleHashtagInputChange}
                onKeyDown={handleHashtagKeyDown}
                onBlur={handleHashtagBlur}
                placeholder="#해시태그 입력"
                className="min-w-[120px] flex-1 border-0 bg-transparent py-1 text-sm text-zinc-950 outline-none placeholder:text-zinc-400"
              />
            </div>
          </div>
        </section>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
