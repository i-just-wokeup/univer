import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { compressImageFile } from "@/lib/image/compress";
import { isValidNickname, normalizeNickname } from "@/lib/utils/nickname";
import { normalizeProfileLinks } from "@/lib/utils/profile-links";
import type { Database } from "@/types/database.types";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];
type ProfileLinkInsert = Database["public"]["Tables"]["profile_links"]["Insert"];

type UpdateProfileParams = {
  avatar_url?: string;
  bio?: string;
  profileLinks?: string[];
  nickname?: string;
};

function requireSupabaseClient() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  return supabase;
}

async function requireCurrentUser() {
  const supabase = requireSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  return { supabase, userId: user.id };
}

export async function updateProfile(
  params: UpdateProfileParams,
): Promise<void> {
  const { supabase, userId } = await requireCurrentUser();
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
  const { supabase, userId } = await requireCurrentUser();
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

export async function uploadAvatar(file: File): Promise<string> {
  const { supabase, userId } = await requireCurrentUser();
  // 아바타는 작게 표시되므로 더 강하게 압축한다. 확장자/경로는 원본 기준 유지.
  const compressedFile = await compressImageFile(file, {
    initialQuality: 0.8,
    maxSizeMB: 0.5,
    maxWidthOrHeight: 512,
  });
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(filePath, compressedFile, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error("프로필 사진 업로드에 실패했습니다.");
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

  return data.publicUrl;
}
