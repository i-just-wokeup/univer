import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type ReportTargetType = "post" | "story" | "user";

export async function createReport({
  targetId,
  targetType,
}: {
  targetId: string;
  targetType: ReportTargetType;
}): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_id: targetId,
    target_type: targetType,
    reason: null,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("이미 신고한 콘텐츠입니다.");
    }

    throw new Error("신고에 실패했습니다.");
  }
}
