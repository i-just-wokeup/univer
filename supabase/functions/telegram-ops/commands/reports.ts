import { formatKstDate } from "../time.ts";
import type { CommandHandler } from "./types.ts";

type ReportRow = {
  created_at: string;
  reason: string | null;
  target_type: "post" | "comment" | "story" | "user";
};

export const reportsCommand: CommandHandler = async ({ supabase }) => {
  const [countResult, rowsResult] = await Promise.all([
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("reports")
      .select("target_type, reason, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (countResult.error || rowsResult.error) {
    throw new Error(
      `Reports query failed: ${countResult.error?.message ?? rowsResult.error?.message}`,
    );
  }

  const rows = (rowsResult.data ?? []) as ReportRow[];
  const details = rows.map(
    (row, index) =>
      `${index + 1}. ${row.target_type} · ${row.reason ?? "사유 없음"} · ${formatKstDate(row.created_at)}`,
  );

  return [
    `처리 대기 신고: ${countResult.count ?? 0}건`,
    ...(details.length > 0 ? ["", ...details] : []),
  ].join("\n");
};
