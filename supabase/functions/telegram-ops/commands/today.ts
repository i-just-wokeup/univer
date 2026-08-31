import { getKstDayRange } from "../time.ts";
import type { CommandHandler } from "./types.ts";

export const todayCommand: CommandHandler = async ({ supabase }) => {
  const { startIso, endIso } = getKstDayRange();
  const [usersResult, postsResult, storiesResult] = await Promise.all([
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .is("deleted_at", null)
      .gte("created_at", startIso)
      .lt("created_at", endIso),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", startIso)
      .lt("created_at", endIso),
    supabase
      .from("stories")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", startIso)
      .lt("created_at", endIso),
  ]);
  const queryError =
    usersResult.error ?? postsResult.error ?? storiesResult.error;

  if (queryError) {
    throw new Error(`Today query failed: ${queryError.message}`);
  }

  return [
    "오늘 현황 (KST)",
    "",
    `신규 가입: ${usersResult.count ?? 0}명`,
    `게시물: ${postsResult.count ?? 0}개`,
    `스토리: ${storiesResult.count ?? 0}개`,
  ].join("\n");
};
