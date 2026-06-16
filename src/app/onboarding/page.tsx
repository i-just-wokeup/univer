"use client";

import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import {
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AuthCard,
  AuthErrorMessage,
  AuthHeader,
  AuthShell,
} from "@/components/auth/AuthLayout";
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
    <AuthShell className="py-5">
      <AuthHeader
        title="학교가 자동으로 인식되었어요"
        description="학교 이메일 기준으로 인증된 정보를 확인해주세요."
      />

      <AuthCard className="mt-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-krew-accent text-3xl font-black text-white shadow-[var(--krew-accent-glow)]">
          국
        </div>
        <h2 className="mt-4 text-lg font-black text-foreground">국민대학교</h2>
        <p className="mt-1 text-xs font-semibold text-krew-muted">
          재학생 인증 완료
        </p>
        <div className="my-5 h-px bg-krew-line" />
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="font-semibold text-krew-muted">실명</dt>
            <dd className="flex min-w-0 items-center gap-1 font-extrabold text-foreground">
              <span className="truncate">{realName || "확인 중"}</span>
              <Lock className="h-3.5 w-3.5 text-krew-faint" aria-hidden="true" />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="font-semibold text-krew-muted">학과</dt>
            <dd className="flex min-w-0 items-center gap-1 font-extrabold text-foreground">
              <span className="truncate">{department || "확인 중"}</span>
              <Lock className="h-3.5 w-3.5 text-krew-faint" aria-hidden="true" />
            </dd>
          </div>
        </dl>
        <p className="mt-5 flex items-center justify-center gap-1 text-xs font-semibold text-krew-faint">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          학교 인증 정보는 수정할 수 없어요
        </p>
      </AuthCard>

      <section className="mt-8">
        <h2 className="text-2xl font-black tracking-[-0.03em] text-foreground">
          프로필을 꾸며볼까요?
        </h2>

        <div className="mt-6 flex justify-center">
          <div className="relative h-24 w-24 rounded-full bg-[linear-gradient(135deg,#e2a37b,#c78254)] shadow-[0_18px_34px_rgba(66,43,102,0.16)]">
            <span className="absolute bottom-0 right-0 h-9 w-9 rounded-full border-[3px] border-background bg-krew-accent shadow-sm" />
          </div>
        </div>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className={AUTH_LABEL_CLASS}>실명</span>
            <input
              value={realName}
              onChange={(event) => setRealName(event.target.value)}
              type="text"
              autoComplete="name"
              pattern="[가-힣\s]+"
              readOnly={isRealNameReadOnly}
              disabled={isLoading}
              title="한글 이름을 입력해주세요."
              className={AUTH_INPUT_CLASS}
              required
            />
          </label>

          <label className="block">
            <span className={AUTH_LABEL_CLASS}>닉네임</span>
            <input
              value={nickname}
              onChange={(event) =>
                setNickname(normalizeNickname(event.target.value))
              }
              type="text"
              disabled={isLoading}
              className={AUTH_INPUT_CLASS}
              required
            />
            <p className="mt-2 text-xs font-semibold text-krew-muted">
              영문 소문자, 숫자, 마침표(.), 밑줄(_)만 사용할 수 있습니다.
            </p>
          </label>

          <label className="block">
            <span className={AUTH_LABEL_CLASS}>학과</span>
            <input
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              type="text"
              readOnly={isDepartmentReadOnly}
              disabled={isLoading}
              className={AUTH_INPUT_CLASS}
              required
            />
          </label>

          {error ? <AuthErrorMessage message={error} /> : null}

          <button
            type="submit"
            disabled={isLoading || isSubmitting || !isNicknameValid}
            className={AUTH_PRIMARY_BUTTON_CLASS}
          >
            {isSubmitting ? "저장 중..." : "KREW 시작하기"}
          </button>
        </form>
      </section>
    </AuthShell>
  );
}
