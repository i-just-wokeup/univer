// 프로필 편집 쓰기 계층 — 프로필 수정·닉네임 중복확인·아바타 업로드. (읽기는 ./api.ts)
import type { Database } from "../../types/database.types";
import { STORAGE_BUCKETS } from "../../lib/constants/storage";
import { getSupabaseMobileClient } from "../../lib/supabase";
import { uploadImagesToBucket } from "../shared/imageUpload";
import { getCurrentUserId } from "../shared/userContext";
import { isValidNickname, normalizeNickname } from "../../lib/utils/nickname";
import { normalizeProfileLinks } from "../../lib/utils/profileLinks";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];
type ProfileLinkInsert =
  Database["public"]["Tables"]["profile_links"]["Insert"];

type UpdateProfileParams = {
  avatar_url?: string;
  bio?: string;
  nickname?: string;
  profileLinks?: string[];
};

// 프로필 수정. 닉네임/소개/아바타는 users 테이블 부분 업데이트, 대표 링크는 전체 삭제 후 재삽입.
// profileLinks가 undefined면 링크는 건드리지 않는다(닉네임만 바꾸는 경우 등).
export async function updateProfile(
  params: UpdateProfileParams,
): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();
  const updateValues: Pick<UserUpdate, "avatar_url" | "bio" | "nickname"> = {};
  const normalizedProfileLinks =
    params.profileLinks === undefined
      ? null
      : normalizeProfileLinks(params.profileLinks);

  if (params.nickname !== undefined) {
    const normalizedNickname = normalizeNickname(params.nickname);

    if (!normalizedNickname) {
      throw new Error("닉네임을 입력해주세요.");
    }

    if (!isValidNickname(normalizedNickname)) {
      throw new Error("닉네임은 영문, 숫자, 마침표, 밑줄만 사용할 수 있습니다.");
    }

    updateValues.nickname = normalizedNickname;
  }

  if (params.bio !== undefined) {
    const trimmedBio = params.bio.trim();
    updateValues.bio = trimmedBio || null;
  }

  if (params.avatar_url !== undefined) {
    const trimmedAvatarUrl = params.avatar_url.trim();
    updateValues.avatar_url = trimmedAvatarUrl || null;
  }

  if (
    params.profileLinks?.some(
      (link) => link.trim() && normalizeProfileLinks([link]).length === 0,
    )
  ) {
    throw new Error("올바른 링크를 입력해주세요.");
  }

  if (Object.keys(updateValues).length === 0) {
    if (params.profileLinks === undefined) {
      return;
    }
  } else {
    const { error } = await supabase
      .from("users")
      .update(updateValues)
      .eq("id", userId);

    if (error) {
      throw new Error("프로필을 저장하지 못했습니다.");
    }
  }

  if (params.profileLinks === undefined) {
    return;
  }

  const { error: deleteError } = await supabase
    .from("profile_links")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    if (deleteError.code === "42P01" && normalizedProfileLinks?.length === 0) {
      return;
    }

    throw new Error("프로필을 저장하지 못했습니다.");
  }

  if (!normalizedProfileLinks || normalizedProfileLinks.length === 0) {
    return;
  }

  const profileLinkRows: ProfileLinkInsert[] = normalizedProfileLinks.map(
    (link) => ({
      label: link.label,
      order_index: link.order_index,
      url: link.url,
      user_id: userId,
    }),
  );

  const { error: insertError } = await supabase
    .from("profile_links")
    .insert(profileLinkRows);

  if (insertError) {
    throw new Error("프로필 링크를 저장하지 못했습니다.");
  }
}

// 닉네임이 본인 외 다른 유저와 겹치는지 여부(true=중복).
export async function checkNicknameDuplicate(
  nickname: string,
): Promise<boolean> {
  const supabase = getSupabaseMobileClient();
  const userId = await getCurrentUserId();
  const normalizedNickname = normalizeNickname(nickname);

  if (!normalizedNickname) {
    throw new Error("닉네임을 입력해주세요.");
  }

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("nickname", normalizedNickname)
    .neq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("닉네임 중복 확인에 실패했습니다.");
  }

  return Boolean(data);
}

// 아바타 이미지를 avatars 버킷의 유저 폴더에 업로드(512px) → 공개 URL.
export async function uploadAvatar(uri: string): Promise<string> {
  const userId = await getCurrentUserId();
  const [publicUrl] = await uploadImagesToBucket(
    STORAGE_BUCKETS.avatars,
    userId,
    [uri],
    512,
  );

  if (!publicUrl) {
    throw new Error("프로필 사진 업로드에 실패했습니다.");
  }

  return publicUrl;
}
