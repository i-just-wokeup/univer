import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getProfile } from "./api";
import { checkNicknameDuplicate, updateProfile, uploadAvatar } from "./mutations";
import { isValidNickname, normalizeNickname } from "../../lib/utils/nickname";
import { normalizeProfileLinks } from "../../lib/utils/profileLinks";

export const BIO_MAX_LENGTH = 60;
export const MAX_PROFILE_LINKS = 5;

export type NicknameStatus =
  | "idle"
  | "checking"
  | "available"
  | "duplicate"
  | "invalid";

function getNicknameMessage(status: NicknameStatus) {
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
      return "";
  }
}

function normalizeLinkInputs(links: string[]) {
  return links.map((link) => link.trim()).filter(Boolean);
}

// 프로필 편집 폼 상태/검증/저장 로직. 저장 성공 여부만 반환하고 화면 이동은 호출부가 한다.
export function useProfileEdit() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [department, setDepartment] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [initialNickname, setInitialNickname] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>("idle");
  const [profileLinks, setProfileLinks] = useState<string[]>([""]);
  const [selectedAvatarUri, setSelectedAvatarUri] = useState<string | null>(
    null,
  );

  const normalizedNickname = useMemo(
    () => normalizeNickname(nickname),
    [nickname],
  );
  const cleanedLinks = useMemo(
    () => normalizeLinkInputs(profileLinks),
    [profileLinks],
  );
  const hasInvalidLink = useMemo(
    () =>
      cleanedLinks.length > 0 &&
      normalizeProfileLinks(cleanedLinks).length !== cleanedLinks.length,
    [cleanedLinks],
  );
  const nicknameMessage = getNicknameMessage(nicknameStatus);
  const canSave =
    !isSaving &&
    !isLoading &&
    normalizedNickname.length > 0 &&
    nicknameStatus !== "checking" &&
    nicknameStatus !== "duplicate" &&
    nicknameStatus !== "invalid" &&
    !hasInvalidLink;

  const loadProfile = useCallback(async () => {
    try {
      setErrorMessage("");
      const { profile } = await getProfile();

      setAvatarUrl(profile.avatar_url);
      setBio(profile.bio ?? "");
      setDepartment(profile.department);
      setInitialNickname(profile.nickname);
      setNickname(profile.nickname);
      setNicknameStatus("idle");
      setProfileLinks(
        profile.links.length > 0 ? profile.links.map((link) => link.url) : [""],
      );
      setSelectedAvatarUri(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "프로필을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const nextNickname = normalizeNickname(nickname);

    if (!nextNickname || !isValidNickname(nextNickname)) {
      setNicknameStatus("invalid");
      return;
    }

    if (nextNickname === initialNickname) {
      setNicknameStatus("idle");
      return;
    }

    setNicknameStatus("checking");
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const duplicated = await checkNicknameDuplicate(nextNickname);
          setNicknameStatus(duplicated ? "duplicate" : "available");
        } catch (error) {
          setNicknameStatus("idle");
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "닉네임 중복 확인에 실패했습니다.",
          );
        }
      })();
    }, 350);

    return () => clearTimeout(timer);
  }, [initialNickname, isLoading, nickname]);

  function handleChangeNickname(value: string) {
    setNickname(normalizeNickname(value));
  }

  function retry() {
    setIsLoading(true);
    void loadProfile();
  }

  async function handlePickAvatar() {
    setErrorMessage("");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setErrorMessage("사진 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      allowsMultipleSelection: false,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const nextUri = result.assets[0].uri;
    setSelectedAvatarUri(nextUri);
    setAvatarUrl(nextUri);
  }

  function handleChangeLink(index: number, value: string) {
    setProfileLinks((currentLinks) =>
      currentLinks.map((link, linkIndex) =>
        linkIndex === index ? value : link,
      ),
    );
  }

  function handleAddLink() {
    setProfileLinks((currentLinks) =>
      currentLinks.length >= MAX_PROFILE_LINKS
        ? currentLinks
        : [...currentLinks, ""],
    );
  }

  function handleRemoveLink(index: number) {
    setProfileLinks((currentLinks) => {
      const nextLinks = currentLinks.filter(
        (_, linkIndex) => linkIndex !== index,
      );
      return nextLinks.length > 0 ? nextLinks : [""];
    });
  }

  // 저장 성공 시 true 반환(화면 이동은 호출부). 실패 시 false.
  async function save(): Promise<boolean> {
    if (!canSave) {
      return false;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const nextAvatarUrl = selectedAvatarUri
        ? await uploadAvatar(selectedAvatarUri)
        : avatarUrl;

      await updateProfile({
        avatar_url: nextAvatarUrl ?? "",
        bio,
        nickname: normalizedNickname,
        profileLinks: cleanedLinks,
      });

      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "프로필을 저장하지 못했습니다.",
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  return {
    avatarUrl,
    bio,
    canSave,
    department,
    errorMessage,
    handleAddLink,
    handleChangeLink,
    handleChangeNickname,
    handlePickAvatar,
    handleRemoveLink,
    hasInvalidLink,
    isLoading,
    isSaving,
    nickname,
    nicknameMessage,
    nicknameStatus,
    profileLinks,
    retry,
    save,
    setBio,
  };
}
