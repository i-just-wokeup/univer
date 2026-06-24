import type { Database } from "../../types/database.types";
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

export async function uploadAvatar(uri: string): Promise<string> {
  const userId = await getCurrentUserId();
  const [publicUrl] = await uploadImagesToBucket("avatars", userId, [uri], 512);

  if (!publicUrl) {
    throw new Error("프로필 사진 업로드에 실패했습니다.");
  }

  return publicUrl;
}
