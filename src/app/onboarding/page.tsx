"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateOnboardingProfile } from "@/features/auth/api";

// 최초 로그인 후 닉네임과 학과를 채우는 온보딩 페이지.
export default function OnboardingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 저장 성공 시 홈으로 이동하고, 실패 시 사용자 메시지만 보여준다.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await updateOnboardingProfile({
        department,
        nickname,
      });

      router.replace("/");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "온보딩 저장에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
            온보딩
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            닉네임과 학과를 입력하면 시작할 수 있습니다.
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">닉네임</span>
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              type="text"
              className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-950"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">학과</span>
            <input
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              type="text"
              className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-950"
              required
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {isSubmitting ? "저장 중..." : "완료"}
          </button>
        </form>
      </div>
    </div>
  );
}
