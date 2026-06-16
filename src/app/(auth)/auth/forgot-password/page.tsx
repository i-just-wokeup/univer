"use client";

import Link from "next/link";
import { useState } from "react";

import {
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AuthCard,
  AuthErrorMessage,
  AuthHeader,
  AuthShell,
} from "@/components/auth/AuthLayout";
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
    <AuthShell>
      <AuthHeader
        title={isSent ? "재설정 메일을 보냈어요" : "비밀번호를 재설정할까요?"}
        description={
          isSent
            ? "메일의 링크를 눌러 새 비밀번호를 설정해주세요."
            : "국민대학교 이메일로 재설정 링크를 받을 수 있습니다."
        }
      />

      {isSent ? (
        <AuthCard className="mt-8 space-y-4">
          <div className="rounded-[18px] border border-white/80 bg-white/75 px-4 py-4 text-sm font-semibold leading-6 text-krew-muted">
            <p>{email}</p>
            <p className="mt-2">
              메일의 링크를 눌러 새 비밀번호를 설정해주세요.
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

            {error ? <AuthErrorMessage message={error} /> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className={AUTH_PRIMARY_BUTTON_CLASS}
            >
              {isSubmitting ? "발송 중..." : "재설정 메일 발송"}
            </button>
          </form>
        </AuthCard>
      )}
    </AuthShell>
  );
}
