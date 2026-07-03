// 신고 데이터 계층 — 게시물/스토리/유저 신고 접수(사유 없음, MVP).
import { getSupabaseMobileClient } from "../../lib/supabase";

export type ReportTargetType = "post" | "comment" | "story" | "user";

// 신고 접수. 같은 대상 중복 신고(23505)는 "이미 신고함"으로 안내.
export async function createReport({
  targetId,
  targetType,
}: {
  targetId: string;
  targetType: ReportTargetType;
}): Promise<void> {
  const supabase = getSupabaseMobileClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { error } = await supabase.from("reports").insert({
    reason: null,
    reporter_id: user.id,
    target_id: targetId,
    target_type: targetType,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("이미 신고한 콘텐츠입니다.");
    }

    throw new Error("신고에 실패했습니다.");
  }
}
