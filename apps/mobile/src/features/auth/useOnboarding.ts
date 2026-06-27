import { useEffect, useMemo, useState } from "react";

import { checkNicknameDuplicate } from "../profile/mutations";
import { useSession } from "../../lib/session";
import {
  isTemporaryNickname,
  isValidNickname,
  normalizeNickname,
} from "../../lib/utils/nickname";
import {
  getCurrentUserProfile,
  shouldRequireOnboarding,
  updateOnboardingProfile,
  type CurrentUserProfile,
} from "./api";

export type NicknameStatus =
  | "idle"
  | "checking"
  | "available"
  | "duplicate"
  | "invalid";

type RedirectTarget = "/" | "/login" | null;

function shouldClearNicknameInput(profile: CurrentUserProfile) {
  const emailLocalPart = profile.email?.split("@")[0]?.toLowerCase();
  const normalizedNickname = profile.nickname.toLowerCase();

  return (
    isTemporaryNickname(profile.nickname) ||
    Boolean(emailLocalPart && normalizedNickname === emailLocalPart)
  );
}

export function getNicknameMessage(status: NicknameStatus) {
  switch (status) {
    case "checking":
      return "닉네임을 확인하는 중입니다.";
    case "available":
      return "사용 가능한 닉네임입니다.";
    case "duplicate":
      return "이미 사용 중인 닉네임입니다.";
    case "invalid":
      return "영문, 숫자, 마침표, 밑줄만 사용할 수 있습니다.";
    default:
      return "영문 소문자, 숫자, 마침표(.), 밑줄(_)만 사용할 수 있습니다.";
  }
}

export function useOnboarding() {
  const { refreshOnboardingStatus } = useSession();
  const [department, setDepartment] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDepartmentReadOnly, setIsDepartmentReadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealNameReadOnly, setIsRealNameReadOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameStatus, setNicknameStatus] =
    useState<NicknameStatus>("idle");
  const [realName, setRealName] = useState("");
  const [redirectTo, setRedirectTo] = useState<RedirectTarget>(null);

  const normalizedNickname = useMemo(
    () => normalizeNickname(nickname),
    [nickname],
  );
  const nicknameMessage = getNicknameMessage(nicknameStatus);
  const canSubmit =
    !isLoading &&
    !isSubmitting &&
    realName.trim().length > 0 &&
    department.trim().length > 0 &&
    isValidNickname(normalizedNickname) &&
    nicknameStatus === "available";

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setErrorMessage("");
        const profile = await getCurrentUserProfile();

        if (!isMounted) {
          return;
        }

        if (!profile) {
          setRedirectTo("/login");
          return;
        }

        if (!shouldRequireOnboarding(profile)) {
          setRedirectTo("/");
          return;
        }

        const nextNickname = shouldClearNicknameInput(profile)
          ? ""
          : profile.nickname;
        setNickname(nextNickname);
        setNicknameStatus(nextNickname ? "available" : "idle");
        setDepartment(profile.department ?? "");
        setRealName(profile.real_name ?? "");
        setIsDepartmentReadOnly(Boolean(profile.department));
        setIsRealNameReadOnly(Boolean(profile.real_name));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
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

  function handleChangeNickname(value: string) {
    const nextNickname = normalizeNickname(value);
    setNickname(nextNickname);
    setNicknameStatus(
      nextNickname && isValidNickname(nextNickname) ? "idle" : "invalid",
    );
  }

  async function handleCheckNickname() {
    if (!isValidNickname(normalizedNickname)) {
      setNicknameStatus("invalid");
      return;
    }

    setErrorMessage("");
    setNicknameStatus("checking");

    try {
      const duplicated = await checkNicknameDuplicate(normalizedNickname);
      setNicknameStatus(duplicated ? "duplicate" : "available");
    } catch (error) {
      setNicknameStatus("idle");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "닉네임 중복 확인에 실패했습니다.",
      );
    }
  }

  async function handleSubmit() {
    if (!canSubmit) {
      return false;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await updateOnboardingProfile({
        department,
        nickname: normalizedNickname,
        realName,
      });
      await refreshOnboardingStatus();
      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "온보딩 저장에 실패했습니다.",
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    canSubmit,
    department,
    errorMessage,
    handleChangeNickname,
    handleCheckNickname,
    handleSubmit,
    isDepartmentReadOnly,
    isLoading,
    isRealNameReadOnly,
    isSubmitting,
    nickname,
    nicknameMessage,
    nicknameStatus,
    realName,
    redirectTo,
    setDepartment,
    setRealName,
  };
}
