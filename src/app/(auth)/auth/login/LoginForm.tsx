"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithPassword } from "@/features/auth/api";

// 서버 페이지가 searchParams에서 읽은 초기 에러를 그대로 내려준다.
type LoginFormProps = {
  initialError: string | null;
};

// 이메일+비밀번호 로그인 폼. 실제 인증 호출은 features/auth/api로 위임한다.
export default function LoginForm({ initialError }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 제출 중 상태를 잠그고, 성공 시 홈으로 이동한다.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signInWithPassword({
        email,
        password,
      });

      router.replace("/");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "로그인 처리에 실패했습니다. 다시 시도해주세요.",
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
            학교 이메일 로그인
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            이메일과 비밀번호로 로그인하세요.
          </p>
        </div>

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

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">비밀번호</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
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
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          처음이신가요?{" "}
          <Link href="/auth/signup" className="font-semibold text-zinc-950">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
