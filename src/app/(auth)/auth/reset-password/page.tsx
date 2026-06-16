"use client";

import { useRouter } from "next/navigation";
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
import { updatePassword } from "@/features/auth/api";

const passwordRules = [
  {
    label: "8자 이상",
    validate: (value: string) => value.length >= 8,
  },
  {
    label: "영문 포함",
    validate: (value: string) => /[a-zA-Z]/.test(value),
  },
  {
    label: "숫자 포함",
    validate: (value: string) => /\d/.test(value),
  },
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const isPasswordValid = passwordRules.every((rule) => rule.validate(password));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError("비밀번호 조건을 모두 충족해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(password);
      router.replace("/auth/login");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "비밀번호 변경에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <AuthHeader
        title="새 비밀번호를 설정해요"
        description="앞으로 사용할 비밀번호를 입력해주세요."
      />

      <AuthCard className="mt-8">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className={AUTH_LABEL_CLASS}>새 비밀번호</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              className={AUTH_INPUT_CLASS}
              required
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {passwordRules.map((rule) => {
                const isValid = rule.validate(password);

                return (
                  <span
                    key={rule.label}
                    className={`text-xs font-semibold ${
                      isValid ? "text-krew-accent" : "text-krew-faint"
                    }`}
                  >
                    {isValid ? "✓ " : ""}
                    {rule.label}
                  </span>
                );
              })}
            </div>
          </label>

          <label className="block">
            <span className={AUTH_LABEL_CLASS}>새 비밀번호 확인</span>
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
            disabled={isSubmitting}
            className={AUTH_PRIMARY_BUTTON_CLASS}
          >
            {isSubmitting ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
