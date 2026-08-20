import type { Metadata } from "next";

import { getUserNickname } from "@/features/auth/api";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import DeleteAccountPageClient from "./DeleteAccountPageClient";

export const metadata: Metadata = {
  title: "계정 삭제 · UNIVER",
  description: "UNIVER 계정 및 관련 데이터 삭제 요청",
};

export default async function DeleteAccountPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  let accountNickname: string | null = null;

  if (supabase && user) {
    try {
      accountNickname = await getUserNickname(supabase, user.id);
    } catch {
      // 프로필 조회 실패가 계정 삭제 진입 자체를 막지 않도록 이메일만 표시한다.
    }
  }

  return (
    <DeleteAccountPageClient
      accountEmail={user?.email ?? null}
      accountNickname={accountNickname}
      isAuthenticated={Boolean(user)}
    />
  );
}
