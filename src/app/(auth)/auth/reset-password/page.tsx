"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
            새 비밀번호 설정
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            새로 사용할 비밀번호를 입력해주세요.
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">새 비밀번호</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-950"
              required
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {passwordRules.map((rule) => {
                const isValid = rule.validate(password);

                return (
                  <span
                    key={rule.label}
                    className={`text-xs font-semibold ${
                      isValid ? "text-green-600" : "text-zinc-400"
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
            <span className="text-sm font-medium text-zinc-700">
              새 비밀번호 확인
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
            {isSubmitting ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      </div>
    </div>
  );
}
