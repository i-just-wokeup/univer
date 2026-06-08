"use client";

import { useEffect, useState } from "react";
import {
  getCurrentUserProfile,
  updateOnboardingProfile,
} from "@/features/auth/api";
import {
  isTemporaryNickname,
  isValidNickname,
  normalizeNickname,
} from "@/lib/utils/nickname";

// 최초 로그인 후 닉네임과 학과를 채우는 온보딩 페이지.
function shouldRequireNicknameInput(profile: {
  email: string | null;
  is_onboarded: boolean;
  nickname: string;
}) {
  if (profile.is_onboarded) {
    return false;
  }

  const emailLocalPart = profile.email?.split("@")[0]?.toLowerCase();
  const normalizedNickname = profile.nickname.toLowerCase();

  return (
    isTemporaryNickname(profile.nickname) ||
    Boolean(emailLocalPart && normalizedNickname === emailLocalPart)
  );
}

export default function OnboardingPage() {
  const [nickname, setNickname] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [realName, setRealName] = useState("");
  const [isDepartmentReadOnly, setIsDepartmentReadOnly] = useState(false);
  const [isRealNameReadOnly, setIsRealNameReadOnly] = useState(false);
  const isNicknameValid = isValidNickname(nickname);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const profile = await getCurrentUserProfile();

        if (!isMounted) {
          return;
        }

        if (!profile) {
          window.location.href = "/auth/login";
          return;
        }

        setNickname(
          shouldRequireNicknameInput(profile) ? "" : profile.nickname ?? "",
        );
        setDepartment(profile.department ?? "");
        setRealName(profile.real_name ?? "");
        setIsDepartmentReadOnly(Boolean(profile.department));
        setIsRealNameReadOnly(Boolean(profile.real_name));
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "프로필 정보를 불러오지 못했습니다.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // 저장 성공 시 홈으로 이동하고, 실패 시 사용자 메시지만 보여준다.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isNicknameValid) {
      setError("닉네임은 영문, 숫자, 마침표, 밑줄만 사용할 수 있습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateOnboardingProfile({
        department,
        nickname,
        realName,
      });

      window.location.href = "/";
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
            실명, 닉네임, 학과를 확인하면 시작할 수 있습니다.
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">실명</span>
            <input
              value={realName}
              onChange={(event) => setRealName(event.target.value)}
              type="text"
              autoComplete="name"
              pattern="[가-힣\s]+"
              readOnly={isRealNameReadOnly}
              disabled={isLoading}
              title="한글 이름을 입력해주세요."
              className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-950 read-only:bg-zinc-50 read-only:text-zinc-500 disabled:bg-zinc-50"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">닉네임</span>
            <input
              value={nickname}
              onChange={(event) =>
                setNickname(normalizeNickname(event.target.value))
              }
              type="text"
              disabled={isLoading}
              className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-950 disabled:bg-zinc-50"
              required
            />
            <p className="mt-2 text-xs font-medium text-zinc-500">
              영문 소문자, 숫자, 마침표(.), 밑줄(_)만 사용할 수 있습니다.
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">학과</span>
            <input
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              type="text"
              readOnly={isDepartmentReadOnly}
              disabled={isLoading}
              className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-950 read-only:bg-zinc-50 read-only:text-zinc-500 disabled:bg-zinc-50"
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
            disabled={isLoading || isSubmitting || !isNicknameValid}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {isSubmitting ? "저장 중..." : "완료"}
          </button>
        </form>
      </div>
    </div>
  );
}
