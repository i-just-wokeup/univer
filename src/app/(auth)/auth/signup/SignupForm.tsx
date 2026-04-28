"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUpWithPassword } from "@/features/auth/api";

// 서버 페이지에서 전달한 초기 에러를 클라이언트 상태로 이어받는다.
type SignupFormProps = {
  initialError: string | null;
};

// 학교 이메일 기반 회원가입 폼. 비밀번호 확인 검증만 UI 레이어에서 처리한다.
export default function SignupForm({ initialError }: SignupFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 비밀번호 일치 여부를 먼저 확인한 뒤 Supabase 회원가입을 호출한다.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signUpWithPassword({
        email,
        password,
      });

      router.replace("/onboarding");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "회원가입에 실패했습니다.",
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
            회원가입
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            국민대학교 이메일로 계정을 만들 수 있습니다.
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
              autoComplete="new-password"
              className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-950"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              비밀번호 확인
            </span>
            <input
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              type="password"
              autoComplete="new-password"
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
            {isSubmitting ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          이미 계정이 있나요?{" "}
          <Link href="/auth/login" className="font-semibold text-zinc-950">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
