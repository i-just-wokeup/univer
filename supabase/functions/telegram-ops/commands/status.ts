import { formatKstDate } from "../time.ts";
import type { CommandHandler } from "./types.ts";

export const statusCommand: CommandHandler = async ({ supabase }) => {
  const startedAt = Date.now();
  const { count, error } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Database health check failed: ${error.message}`);
  }

  return [
    "unip 운영 현황",
    "",
    "Edge Function: 정상",
    `Database: 정상 (${Date.now() - startedAt}ms)`,
    `이용 가능 계정: ${count ?? 0}명`,
    `확인 시각: ${formatKstDate(new Date().toISOString())}`,
  ].join("\n");
};
