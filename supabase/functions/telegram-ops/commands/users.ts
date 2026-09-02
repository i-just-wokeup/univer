import { getKstDayRange } from "../time.ts";
import type { CommandHandler } from "./types.ts";

export const usersCommand: CommandHandler = async ({ supabase }) => {
  const { startIso, endIso } = getKstDayRange();
  const [totalResult, activeResult, restrictedResult, todayResult] =
    await Promise.all([
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .is("deleted_at", null),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("is_active", false)
        .is("deleted_at", null),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .gte("created_at", startIso)
        .lt("created_at", endIso),
    ]);
  const queryError =
    totalResult.error ??
    activeResult.error ??
    restrictedResult.error ??
    todayResult.error;

  if (queryError) {
    throw new Error(`Users query failed: ${queryError.message}`);
  }

  return [
    "이용자 현황",
    "",
    `전체 이용자: ${totalResult.count ?? 0}명`,
    `이용 가능 계정: ${activeResult.count ?? 0}명`,
    `이용 제한: ${restrictedResult.count ?? 0}명`,
    `오늘 신규: ${todayResult.count ?? 0}명`,
  ].join("\n");
};
