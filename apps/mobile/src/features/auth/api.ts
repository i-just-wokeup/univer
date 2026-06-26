import type { Database } from "../../types/database.types";
import { getSupabaseMobileClient } from "../../lib/supabase";
import {
  isTemporaryNickname,
  isValidNickname,
  normalizeNickname,
} from "../../lib/utils/nickname";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type CurrentUserProfile = Pick<
  UserRow,
  | "avatar_url"
  | "bio"
  | "created_at"
  | "credit_balance"
  | "deleted_at"
  | "department"
  | "id"
  | "is_active"
  | "is_onboarded"
  | "level"
  | "level_score"
  | "nickname"
  | "role"
  | "university_id"
  | "visibility"
> & {
  email: string | null;
  real_name: string | null;
};

type UpdateOnboardingParams = {
  department: string;
  nickname: string;
  realName: string;
};

export function shouldRequireOnboarding(profile: {
  email: string | null;
  is_onboarded: boolean;
  nickname: string;
}) {
  if (!profile.is_onboarded) {
    return true;
  }

  const emailLocalPart = profile.email?.split("@")[0]?.toLowerCase();
  const normalizedNickname = profile.nickname.toLowerCase();

  return (
    isTemporaryNickname(profile.nickname) ||
    Boolean(emailLocalPart && normalizedNickname === emailLocalPart)
  );
}

export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  const supabase = getSupabaseMobileClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, nickname, bio, avatar_url, university_id, department, credit_balance, level, level_score, role, is_onboarded, is_active, visibility, deleted_at, created_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("사용자 정보를 불러오지 못했습니다.");
  }

  if (!data) {
    return null;
  }

  const { data: realName, error: realNameError } = await supabase.rpc(
    "get_user_real_name",
    { p_user_id: user.id },
  );

  if (realNameError) {
    throw new Error("실명 정보를 불러오지 못했습니다.");
  }

  return {
    ...data,
    email: user.email ?? null,
    real_name: realName ?? null,
  };
}

export async function getUserOnboardingRequired(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    return false;
  }

  return shouldRequireOnboarding(profile);
}

export async function updateOnboardingProfile({
  department,
  nickname,
  realName,
}: UpdateOnboardingParams): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const normalizedNickname = normalizeNickname(nickname);
  const trimmedDepartment = department.trim();
  const trimmedRealName = realName.trim();

  if (!normalizedNickname || !trimmedDepartment || !trimmedRealName) {
    throw new Error("실명, 닉네임, 학과를 모두 입력해주세요.");
  }

  if (!isValidNickname(normalizedNickname)) {
    throw new Error("닉네임은 영문, 숫자, 마침표, 밑줄만 사용할 수 있습니다.");
  }

  const { data: existingNickname, error: nicknameError } = await supabase
    .from("users")
    .select("id")
    .eq("nickname", normalizedNickname)
    .neq("id", user.id)
    .maybeSingle();

  if (nicknameError) {
    throw new Error("닉네임 중복 확인에 실패했습니다.");
  }

  if (existingNickname) {
    throw new Error("이미 사용 중인 닉네임입니다.");
  }

  const { error } = await supabase
    .from("users")
    .update({
      department: trimmedDepartment,
      is_onboarded: true,
      nickname: normalizedNickname,
      real_name: trimmedRealName,
    })
    .eq("id", user.id);

  if (error) {
    throw new Error("온보딩 저장에 실패했습니다.");
  }
}
