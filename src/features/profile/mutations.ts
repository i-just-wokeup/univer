import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/database.types";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

type UpdateProfileParams = {
  avatar_url?: string;
  bio?: string;
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

  if (params.nickname !== undefined) {
    const trimmedNickname = params.nickname.trim();

    if (!trimmedNickname) {
      throw new Error("닉네임을 입력해주세요.");
    }

    updateValues.nickname = trimmedNickname;
  }

  if (params.bio !== undefined) {
    const trimmedBio = params.bio.trim();
    updateValues.bio = trimmedBio || null;
  }

  if (params.avatar_url !== undefined) {
    const trimmedAvatarUrl = params.avatar_url.trim();
    updateValues.avatar_url = trimmedAvatarUrl || null;
  }

  if (Object.keys(updateValues).length === 0) {
    return;
  }

  const { error } = await supabase
    .from("users")
    .update(updateValues)
    .eq("id", userId);

  if (error) {
    throw new Error("프로필을 저장하지 못했습니다.");
  }
}

export async function checkNicknameDuplicate(
  nickname: string,
): Promise<boolean> {
  const { supabase, userId } = await requireCurrentUser();
  const trimmedNickname = nickname.trim();

  if (!trimmedNickname) {
    throw new Error("닉네임을 입력해주세요.");
  }

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("nickname", trimmedNickname)
    .neq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("닉네임 중복 확인에 실패했습니다.");
  }

  return Boolean(data);
}

export async function uploadAvatar(file: File): Promise<string> {
  const { supabase, userId } = await requireCurrentUser();
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error("프로필 사진 업로드에 실패했습니다.");
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

  return data.publicUrl;
}
