import type { User } from "@supabase/supabase-js";

import { getSupabaseMobileClient } from "../../lib/supabase";

export function isEmailPasswordUser(user: User | null | undefined): boolean {
  return (
    user?.app_metadata.provider === "email" ||
    user?.identities?.some((identity) => identity.provider === "email") === true
  );
}

export async function verifyCurrentPassword(
  currentPassword: string,
): Promise<void> {
  const supabase = getSupabaseMobileClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    throw new Error("로그인 정보를 확인할 수 없습니다.");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (error) {
    throw new Error("현재 비밀번호가 올바르지 않습니다.");
  }
}

export async function updateCurrentUserPassword(
  newPassword: string,
): Promise<void> {
  const { error } = await getSupabaseMobileClient().auth.updateUser({
    password: newPassword,
  });

  if (error) {
    // 유출/약한 비밀번호(HaveIBeenPwned) 차단 시 Supabase가 영어로 반환 → 한글 안내로 변환
    if (error.code === "weak_password" || /weak|pwned|leaked/i.test(error.message)) {
      throw new Error(
        "너무 흔하거나 유출된 적 있는 비밀번호예요. 다른 비밀번호를 사용해 주세요.",
      );
    }

    throw new Error(error.message || "비밀번호를 변경하지 못했습니다.");
  }
}
