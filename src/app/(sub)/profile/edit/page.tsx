"use client";

import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Avatar } from "@/components/common/Avatar";
import { KREW_SURFACE_CLASS } from "@/components/common/KrewLayout";
import { getCurrentUserProfile } from "@/features/auth/api";
import { getProfileLinks } from "@/features/profile/api";
import {
  checkNicknameDuplicate,
  updateProfile,
  uploadAvatar,
} from "@/features/profile/mutations";
import { normalizeProfileUrl } from "@/lib/utils/profile-links";

type CurrentUserProfile = NonNullable<
  Awaited<ReturnType<typeof getCurrentUserProfile>>
>;

type NicknameStatus =
  | "available"
  | "checking"
  | "duplicate"
  | "error"
  | "idle";

const nicknamePattern = /^[a-zA-Z0-9._]+$/;

function normalizeNickname(value: string) {
  return value.replace(/[^a-zA-Z0-9._]/g, "").slice(0, 30);
}

function isValidNickname(value: string) {
  return value.length > 0 && nicknamePattern.test(value);
}

export default function ProfileEditPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [department, setDepartment] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [initialNickname, setInitialNickname] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameStatus, setNicknameStatus] =
    useState<NicknameStatus>("idle");
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [profileLink, setProfileLink] = useState("");

  const isNicknameValid = isValidNickname(nickname);
  const isProfileLinkValid =
    !profileLink.trim() || Boolean(normalizeProfileUrl(profileLink));
  const isSaveDisabled =
    isLoading ||
    isSaving ||
    isUploadingAvatar ||
    !isNicknameValid ||
    !isProfileLinkValid ||
    nicknameStatus === "checking" ||
    nicknameStatus === "duplicate";

  const nicknameMessage = useMemo(() => {
    if (!nickname) {
      return "";
    }

    if (!isNicknameValid) {
      return "영문, 숫자, 마침표, 밑줄만 사용할 수 있습니다.";
    }

    if (nicknameStatus === "checking") {
      return "닉네임을 확인하고 있습니다.";
    }

    if (nicknameStatus === "duplicate") {
      return "이미 사용 중인 닉네임입니다";
    }

    if (nicknameStatus === "available") {
      return "사용 가능한 닉네임입니다";
    }

    if (nicknameStatus === "error") {
      return "닉네임 확인에 실패했습니다.";
    }

    return "";
  }, [isNicknameValid, nickname, nicknameStatus]);

  const nicknameMessageClassName =
    nicknameStatus === "available"
      ? "text-green-600"
      : nicknameStatus === "duplicate" || nicknameStatus === "error"
        ? "text-red-500"
        : "text-krew-muted";

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const currentProfile = await getCurrentUserProfile();

        if (!isMounted) {
          return;
        }

        if (!currentProfile) {
          router.replace("/auth/login");
          return;
        }

        const profileLinks = await getProfileLinks(currentProfile.id);

        if (!isMounted) {
          return;
        }

        const currentNickname = normalizeNickname(currentProfile.nickname);

        setProfile(currentProfile);
        setAvatarUrl(currentProfile.avatar_url);
        setBio(currentProfile.bio ?? "");
        setDepartment(currentProfile.department);
        setInitialNickname(currentNickname);
        setNickname(currentNickname);
        setNicknameStatus("available");
        setProfileLink(profileLinks[0]?.url ?? "");
      } catch (error: unknown) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "프로필 정보를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, [router]);

  useEffect(() => {
    const normalizedNickname = nickname.toLowerCase();
    const shouldCheckDuplicate =
      nickname &&
      isNicknameValid &&
      normalizedNickname !== initialNickname.toLowerCase();

    const timeoutId = window.setTimeout(
      () => {
        if (!nickname || !isNicknameValid) {
          setNicknameStatus("idle");
          return;
        }

        if (normalizedNickname === initialNickname.toLowerCase()) {
          setNicknameStatus("available");
          return;
        }

        setNicknameStatus("checking");

        checkNicknameDuplicate(normalizedNickname)
          .then((isDuplicate) => {
            setNicknameStatus(isDuplicate ? "duplicate" : "available");
          })
          .catch(() => {
            setNicknameStatus("error");
          });
      },
      shouldCheckDuplicate ? 300 : 0,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [initialNickname, isNicknameValid, nickname]);

  function handleNicknameChange(event: ChangeEvent<HTMLInputElement>) {
    setNickname(normalizeNickname(event.target.value));
    setErrorMessage("");
  }

  function handleBioChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setBio(event.target.value.slice(0, 150));
    setErrorMessage("");
  }

  function handleProfileLinkChange(event: ChangeEvent<HTMLInputElement>) {
    setProfileLink(event.target.value.slice(0, 200));
    setErrorMessage("");
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setAvatarUrl(previewUrl);
    setIsUploadingAvatar(true);
    setErrorMessage("");

    try {
      const uploadedUrl = await uploadAvatar(file);
      setAvatarUrl(uploadedUrl);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "프로필 사진 업로드에 실패했습니다.",
      );
      setAvatarUrl(profile?.avatar_url ?? null);
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  }

  async function handleSave() {
    if (isSaveDisabled) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const normalizedNickname = nickname.toLowerCase();

      await updateProfile({
        avatar_url: avatarUrl ?? "",
        bio,
        nickname: normalizedNickname,
        profileLinks: profileLink.trim() ? [profileLink] : [],
      });
      router.push(`/profile/${encodeURIComponent(normalizedNickname)}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "프로필을 저장하지 못했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    if (initialNickname) {
      router.push(`/profile/${encodeURIComponent(initialNickname)}`);
      return;
    }

    router.back();
  }

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      <header className="sticky top-0 z-20 border-b border-krew-line bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            type="button"
            onClick={handleCancel}
            className="text-sm font-bold text-krew-muted transition hover:text-krew-accent"
          >
            취소
          </button>
          <h1 className="text-base font-black tracking-[-0.02em]">
            프로필 편집
          </h1>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaveDisabled}
            className="rounded-full bg-krew-accent px-4 py-2 text-sm font-extrabold text-white transition hover:brightness-95 disabled:bg-white/70 disabled:text-krew-faint"
          >
            저장
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-sm px-4 py-6">
        <section className={`${KREW_SURFACE_CLASS} px-4 py-6 text-center`}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative cursor-pointer rounded-full disabled:cursor-default"
            disabled={isLoading || isUploadingAvatar}
            aria-label="프로필 사진 변경"
          >
            <Avatar
              src={avatarUrl}
              nickname={nickname || "프로필"}
              size="xl"
            />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/35">
              <Camera className="h-6 w-6 text-white" />
            </span>
            {isUploadingAvatar ? (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-xs font-bold text-white">
                업로드
              </span>
            ) : null}
          </button>
          <p className="mt-3 text-sm font-extrabold text-foreground">
            {nickname || "프로필"}
          </p>
          <p className="mt-1 text-xs font-semibold text-krew-muted">
            프로필 사진 변경
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </section>

        <section className="mt-4 space-y-4">
          <label className={`${KREW_SURFACE_CLASS} block p-4`}>
            <span className="text-sm font-extrabold text-foreground">
              닉네임
            </span>
            <input
              value={nickname}
              onChange={handleNicknameChange}
              maxLength={30}
              inputMode="text"
              autoCapitalize="none"
              disabled={isLoading}
              className="mt-2 h-12 w-full rounded-[18px] border border-white/80 bg-white/85 px-4 text-sm font-semibold text-foreground shadow-sm outline-none transition placeholder:text-krew-faint focus:border-krew-accent-ring focus:bg-white disabled:bg-white/50"
            />
            <p className="mt-2 text-xs font-semibold text-krew-muted">
              영문 소문자, 숫자, 마침표(.), 밑줄(_)만 사용 가능 (최대 30자)
            </p>
            {nicknameMessage ? (
              <p className={`mt-2 text-xs font-semibold ${nicknameMessageClassName}`}>
                {nicknameMessage}
              </p>
            ) : null}
          </label>

          <label className={`${KREW_SURFACE_CLASS} block p-4`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-foreground">
                소개
              </span>
              <span className="text-xs font-semibold text-krew-faint">
                {bio.length}/150
              </span>
            </div>
            <textarea
              value={bio}
              onChange={handleBioChange}
              maxLength={150}
              rows={4}
              disabled={isLoading}
              className="mt-2 w-full resize-none rounded-[18px] border border-white/80 bg-white/85 px-4 py-3 text-sm font-medium leading-6 text-foreground outline-none transition placeholder:text-krew-faint focus:border-krew-accent-ring focus:bg-white disabled:bg-white/50"
            />
          </label>

          <label className={`${KREW_SURFACE_CLASS} block p-4`}>
            <span className="text-sm font-extrabold text-foreground">
              대표 링크
            </span>
            <input
              value={profileLink}
              onChange={handleProfileLinkChange}
              maxLength={200}
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isLoading}
              placeholder="instagram.com/username"
              className="mt-2 h-12 w-full rounded-[18px] border border-white/80 bg-white/85 px-4 text-sm font-semibold text-foreground shadow-sm outline-none transition placeholder:text-krew-faint focus:border-krew-accent-ring focus:bg-white disabled:bg-white/50"
            />
            <p
              className={`mt-2 text-xs font-semibold ${
                isProfileLinkValid ? "text-krew-muted" : "text-red-500"
              }`}
            >
              {isProfileLinkValid
                ? "인스타그램, 유튜브, 틱톡 등 외부 링크를 입력할 수 있습니다."
                : "올바른 링크를 입력해주세요."}
            </p>
          </label>

          <div className={`${KREW_SURFACE_CLASS} p-4`}>
            <p className="text-sm font-extrabold text-foreground">학과</p>
            <p className="mt-2 rounded-[18px] bg-white/70 px-4 py-3 text-sm font-semibold text-krew-muted">
              {department || "학과 정보 없음"}
            </p>
          </div>
        </section>

        {errorMessage ? (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {errorMessage}
          </p>
        ) : null}

      </main>
    </div>
  );
}
