"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";

import {
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AuthCard,
  AuthErrorMessage,
  AuthHeader,
  AuthShell,
} from "@/components/auth/AuthLayout";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { signInWithGoogle, signUpWithPassword } from "@/features/auth/api";

// 서버 페이지에서 전달한 초기 에러를 클라이언트 상태로 이어받는다.
type SignupFormProps = {
  initialError: string | null;
};

// 학교 이메일 기반 회원가입 폼. 비밀번호 확인 검증만 UI 레이어에서 처리한다.
export default function SignupForm({ initialError }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [realName, setRealName] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const passwordRules = [
    {
      isValid: password.length >= 8,
      label: "8자 이상",
    },
    {
      isValid: /[a-zA-Z]/.test(password),
      label: "영문 포함",
    },
    {
      isValid: /\d/.test(password),
      label: "숫자 포함",
    },
  ];
  const isPasswordValid = passwordRules.every((rule) => rule.isValid);

  // 비밀번호 일치 여부를 먼저 확인한 뒤 Supabase 회원가입을 호출한다.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!isPasswordValid) {
      setError("비밀번호 조건을 모두 충족해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signUpWithPassword({
        email,
        password,
        realName,
      });

      setIsEmailSent(true);
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

  async function handleGoogleSignup() {
    setError(null);
    setIsGoogleSubmitting(true);

    try {
      await signInWithGoogle();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Google 가입 처리에 실패했습니다.",
      );
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <AuthHeader
        title={isEmailSent ? "인증 메일을 보냈어요" : "학교 이메일로 시작해볼까요?"}
        description={
          isEmailSent
            ? "메일을 확인한 뒤 다시 로그인해주세요."
            : "국민대학교 이메일로 가입하면 같은 학교 사람들과 연결됩니다."
        }
      />

      {isEmailSent ? (
        <AuthCard className="mt-8 space-y-4">
          <div className="rounded-[18px] border border-white/80 bg-white/75 px-4 py-4 text-sm font-semibold leading-6 text-krew-muted">
            <p>{email}</p>
            <p className="mt-2">
              메일의 인증 링크를 눌러 가입을 완료한 뒤 다시 로그인해주세요.
            </p>
          </div>
          <Link href="/auth/login" className={AUTH_PRIMARY_BUTTON_CLASS}>
            로그인으로 이동
          </Link>
        </AuthCard>
      ) : (
        <AuthCard className="mt-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
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
              <span className={AUTH_LABEL_CLASS}>실명</span>
              <input
                value={realName}
                onChange={(event) => setRealName(event.target.value)}
                type="text"
                autoComplete="name"
                pattern="[가-힣\s]+"
                placeholder="홍길동"
                title="한글 이름을 입력해주세요."
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
                autoComplete="new-password"
                className={AUTH_INPUT_CLASS}
                required
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {passwordRules.map((rule) => (
                  <span
                    key={rule.label}
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      rule.isValid ? "text-krew-accent" : "text-krew-faint"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    {rule.label}
                  </span>
                ))}
              </div>
            </label>

            <label className="block">
              <span className={AUTH_LABEL_CLASS}>비밀번호 확인</span>
              <input
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                type="password"
                autoComplete="new-password"
                className={AUTH_INPUT_CLASS}
                required
              />
            </label>

            {error ? <AuthErrorMessage message={error} /> : null}

            <button
              type="submit"
              disabled={isSubmitting || isGoogleSubmitting}
              className={AUTH_PRIMARY_BUTTON_CLASS}
            >
              {isSubmitting ? "가입 중..." : "회원가입"}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-krew-line" />
              <span className="text-xs font-semibold text-krew-faint">또는</span>
              <div className="h-px flex-1 bg-krew-line" />
            </div>

            <GoogleAuthButton
              label="국민대 계정으로 가입"
              onClick={handleGoogleSignup}
              disabled={isSubmitting || isGoogleSubmitting}
            />
          </form>
        </AuthCard>
      )}

      <p className="mt-6 text-center text-sm font-semibold text-krew-muted">
        이미 계정이 있나요?{" "}
        <Link href="/auth/login" className="font-extrabold text-krew-accent">
          로그인
        </Link>
      </p>
    </AuthShell>
  );
}
