// 인증/온보딩 데이터 계층 — 현재 유저 프로필 조회, 온보딩 필요 판정/저장, 로그아웃.
// (구글 로그인은 별도 모듈, 세션·가드는 lib/session.tsx)
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

// 로그아웃. 이 기기의 푸시 토큰을 현재 유저에서 떼어낸 뒤 세션을 종료한다.
// (안 떼면 로그아웃한 계정 앞으로 온 푸시가 계속 이 기기에 옴 — 계정 전환 시 남의 알림 수신)
export async function signOutMobile(): Promise<void> {
  const supabase = getSupabaseMobileClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // 토큰 정리 실패가 로그아웃을 막지 않도록 best-effort 처리.
    await supabase
      .from("users")
      .update({ fcm_token: null })
      .eq("id", user.id)
      .then(undefined, () => undefined);
  }

  await supabase.auth.signOut();
}

// 온보딩 필요 여부 판정(가드용 순수함수). 미완료거나 닉네임이 임시값/이메일 앞부분과 같으면 true.
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

// 현재 로그인 유저의 전체 프로필(+실명 RPC). 비로그인/없으면 null.
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

// 현재 유저가 온보딩을 더 거쳐야 하는지(가드용).
export async function getUserOnboardingRequired(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    return false;
  }

  return shouldRequireOnboarding(profile);
}

// 온보딩 완료 저장 — 실명/닉네임/학과 검증 + 닉네임 중복 확인 후 저장(is_onboarded).
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
