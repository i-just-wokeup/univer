import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/database.types";

// 인증 관련 API에서 공통으로 쓰는 Supabase 타입 별칭.
export type AuthSupabaseClient = SupabaseClient<Database>;

// universities 테이블의 한 줄을 그대로 노출할 때 사용하는 타입.
export type University = Database["public"]["Tables"]["universities"]["Row"];
type AuthUser = Database["public"]["Tables"]["users"]["Row"];

// 브라우저 클라이언트가 준비되지 않은 경우 모든 인증 호출을 동일한 에러로 막는다.
function requireSupabaseClient() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  return supabase;
}

// 이메일 비교를 위한 기본 정규화.
function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

// 이메일에서 도메인 부분만 추출한다.
export function extractEmailDomain(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const atIndex = normalizedEmail.lastIndexOf("@");

  if (atIndex < 1 || atIndex === normalizedEmail.length - 1) {
    return null;
  }

  return normalizedEmail.slice(atIndex + 1);
}

// universities 테이블에서 현재 이메일 도메인과 일치하는 학교를 찾는다.
export async function findUniversityByEmail(
  supabase: AuthSupabaseClient,
  email: string,
) {
  const domain = extractEmailDomain(email);

  if (!domain) {
    return null;
  }

  const { data, error } = await supabase
    .from("universities")
    .select("id, name, domain, is_active, created_at")
    .eq("domain", domain)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error("학교 이메일 확인에 실패했습니다.");
  }

  return data satisfies University | null;
}

// 로그인 폼에서 전달하는 최소 파라미터.
type SignInWithPasswordParams = {
  email: string;
  password: string;
};

// 회원가입 폼에서 전달하는 최소 파라미터.
type SignUpWithPasswordParams = {
  email: string;
  password: string;
};

// 온보딩 완료 시 저장할 프로필 필드.
type UpdateOnboardingParams = {
  department: string;
  nickname: string;
};

// 이메일+비밀번호 로그인. 에러 메시지는 UI에 바로 노출 가능한 형태로 통일한다.
export async function signInWithPassword(params: SignInWithPasswordParams) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(params.email),
    password: params.password,
  });

  if (error) {
    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  }
}

// 현재 MVP에서는 국민대 이메일만 허용한다. 추후 universities 조회로 바꿀 예정.
export async function signUpWithPassword(params: SignUpWithPasswordParams) {
  const supabase = requireSupabaseClient();
  const domain = extractEmailDomain(params.email);

  if (domain !== "kookmin.ac.kr") {
    throw new Error("국민대학교 이메일(kookmin.ac.kr)만 가입할 수 있습니다.");
  }

  const { error } = await supabase.auth.signUp({
    email: normalizeEmail(params.email),
    password: params.password,
  });

  if (error) {
    throw new Error("회원가입에 실패했습니다. 다시 시도해주세요.");
  }
}

// 미들웨어와 콜백 라우트에서 공용으로 쓰는 온보딩 완료 여부 조회.
export async function getUserOnboardingStatus(
  supabase: AuthSupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("users")
    .select("is_onboarded")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("사용자 상태를 확인할 수 없습니다.");
  }

  return data?.is_onboarded ?? false;
}

// 로그인된 사용자의 public.users 프로필을 온보딩 값으로 업데이트한다.
export async function updateOnboardingProfile({
  department,
  nickname,
}: UpdateOnboardingParams) {
  const supabase = requireSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const trimmedNickname = nickname.trim();
  const trimmedDepartment = department.trim();

  if (!trimmedNickname || !trimmedDepartment) {
    throw new Error("닉네임과 학과를 모두 입력해주세요.");
  }

  const { error } = await supabase
    .from("users")
    .update({
      department: trimmedDepartment,
      is_onboarded: true,
      nickname: trimmedNickname,
    })
    .eq("id", user.id);

  if (error) {
    throw new Error("온보딩 저장에 실패했습니다.");
  }
}

// 현재 로그인한 사용자의 public.users 행을 가져온다.
export async function getCurrentUserProfile() {
  const supabase = requireSupabaseClient();
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
      "id, email, nickname, avatar_url, university_id, department, role, is_onboarded, is_active, fcm_token, visibility, deleted_at, created_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("사용자 정보를 불러오지 못했습니다.");
  }

  return data satisfies AuthUser | null;
}
