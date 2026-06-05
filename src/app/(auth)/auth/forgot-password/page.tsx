"use client";

import Link from "next/link";
import { useState } from "react";

import { resetPasswordForEmail } from "@/features/auth/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await resetPasswordForEmail(email);
      setIsSent(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "재설정 메일 발송에 실패했습니다.",
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
            비밀번호 재설정
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {isSent
              ? "재설정 메일을 발송했습니다."
              : "국민대학교 이메일로 재설정 링크를 받을 수 있습니다."}
          </p>
        </div>

        {isSent ? (
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm leading-6 text-zinc-600">
              <p>{email}</p>
              <p className="mt-2">
                메일의 링크를 눌러 새 비밀번호를 설정해주세요.
              </p>
            </div>
            <Link
              href="/auth/login"
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              로그인으로 이동
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">학교 이메일</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                placeholder="example@kookmin.ac.kr"
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
              {isSubmitting ? "발송 중..." : "재설정 메일 발송"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
