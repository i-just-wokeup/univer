"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AuthErrorMessage,
  AuthKrewMark,
  AuthShell,
} from "@/components/auth/AuthLayout";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { signInWithGoogle, signInWithPassword } from "@/features/auth/api";

// 서버 페이지가 searchParams에서 읽은 초기 에러를 그대로 내려준다.
type LoginFormProps = {
  initialError: string | null;
  redirectTo: string;
};

// 이메일+비밀번호 로그인 폼. 실제 인증 호출은 features/auth/api로 위임한다.
export default function LoginForm({ initialError, redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
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

      router.replace(redirectTo);
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

  async function handleGoogleLogin() {
    setError(null);
    setIsGoogleSubmitting(true);

    try {
      await signInWithGoogle(redirectTo);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Google 로그인 처리에 실패했습니다.",
      );
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <AuthKrewMark />

      <section className="pb-2">
        <form
          className="rounded-[24px] border border-white/70 bg-white/60 p-4 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="mb-4">
            <h2 className="text-sm font-black text-foreground">
              이메일로 로그인
            </h2>
            <p className="mt-1 text-xs font-semibold text-krew-muted">
              가입한 학교 이메일과 비밀번호를 입력하세요.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className={AUTH_LABEL_CLASS}>학교 이메일</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                placeholder="example@kookmin.ac.kr"
                className={AUTH_INPUT_CLASS}
                required
              />
            </label>

            <label className="block">
              <span className={AUTH_LABEL_CLASS}>비밀번호</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                className={AUTH_INPUT_CLASS}
                required
              />
              <div className="mt-2 text-right">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-bold text-krew-muted transition hover:text-krew-accent"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
            </label>

            {error ? <AuthErrorMessage message={error} /> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className={AUTH_PRIMARY_BUTTON_CLASS}
            >
              {isSubmitting ? "로그인 중..." : "로그인"}
            </button>
          </div>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-krew-line" />
            <span className="text-xs font-semibold text-krew-faint">또는</span>
            <div className="h-px flex-1 bg-krew-line" />
          </div>

          <GoogleAuthButton
            label={
              isGoogleSubmitting ? "연결 중..." : "학교 Google 계정으로 시작하기"
            }
            onClick={handleGoogleLogin}
            disabled={isSubmitting || isGoogleSubmitting}
          />

          <p className="mt-5 text-center text-sm font-semibold text-krew-muted">
            처음이신가요?{" "}
            <Link
              href="/auth/signup"
              className="font-extrabold text-krew-accent"
            >
              회원가입
            </Link>
          </p>
          <p className="mt-5 text-center text-[11px] font-medium leading-5 text-krew-faint">
            계속하면 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
          </p>
        </form>
      </section>
    </AuthShell>
  );
}
