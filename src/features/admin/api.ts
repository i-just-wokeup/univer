import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Json } from "@/types/database.types";

export type AdminPeriod = "day" | "month" | "year" | "all";
export type AdminReportAction = "delete" | "dismiss" | "restore";
export type AdminReportStatus = "pending" | "reviewed" | "dismissed" | "action_taken";
export type AdminReportFilter = AdminReportStatus | "all";
export type AdminRole = "user" | "official" | "admin";

export type DashboardMetricCounts = {
  comments: number;
  likes: number;
  pendingReports: number;
  posts: number;
  signups: number;
  stories: number;
};

export type DashboardStats = Record<AdminPeriod, DashboardMetricCounts>;

export type AdminReport = {
  authorNickname: string | null;
  createdAt: string;
  id: string;
  previewText: string | null;
  reporterNickname: string | null;
  status: AdminReportStatus;
  targetAuthorNickname: string | null;
  targetType: "post" | "story";
  thumbnailUrl: string | null;
};

export type AdminUser = {
  avatarUrl: string | null;
  createdAt: string;
  email: string | null;
  id: string;
  nickname: string;
  postsCount: number;
  reportedCount: number;
  role: AdminRole;
};

type JsonRecord = Record<string, Json | null | undefined>;

const EMPTY_METRICS: DashboardMetricCounts = {
  comments: 0,
  likes: 0,
  pendingReports: 0,
  posts: 0,
  signups: 0,
  stories: 0,
};

function requireSupabaseClient() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  return supabase;
}

type RpcClient = {
  rpc: (
    functionName: string,
    args?: Record<string, string | number | null>,
  ) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

function isRecord(value: Json | null | undefined): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNumber(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const parsedValue = Number(value);

      if (!Number.isNaN(parsedValue)) {
        return parsedValue;
      }
    }
  }

  return 0;
}

function readString(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

async function callRpcWithVariants<T>(
  functionName: string,
  variants: Array<Record<string, string | number | null>>,
) {
  const supabase = requireSupabaseClient() as unknown as RpcClient;
  let lastError: Error | null = null;

  for (const params of variants) {
    const { data, error } = await supabase.rpc(functionName, params);

    if (!error) {
      return data as T;
    }

    lastError = new Error(error.message);
  }

  throw lastError ?? new Error("관리자 데이터를 불러오지 못했습니다.");
}

function normalizeDashboardStats(rawData: Json | null): DashboardStats {
  const emptyStats: DashboardStats = {
    all: { ...EMPTY_METRICS },
    day: { ...EMPTY_METRICS },
    month: { ...EMPTY_METRICS },
    year: { ...EMPTY_METRICS },
  };

  if (!isRecord(rawData)) {
    return emptyStats;
  }

  const users = isRecord(rawData.users) ? rawData.users : null;
  const posts = isRecord(rawData.posts) ? rawData.posts : null;
  const stories = isRecord(rawData.stories) ? rawData.stories : null;
  const comments = isRecord(rawData.comments) ? rawData.comments : null;
  const likes = isRecord(rawData.likes) ? rawData.likes : null;
  const reports = isRecord(rawData.reports) ? rawData.reports : null;
  const pendingReports = reports ? readNumber(reports, ["pending"]) : 0;

  function getMetrics(periodKey: "today" | "month" | "year" | "total"): DashboardMetricCounts {
    return {
      comments: comments ? readNumber(comments, [periodKey]) : 0,
      likes: likes ? readNumber(likes, [periodKey]) : 0,
      pendingReports,
      posts: posts ? readNumber(posts, [periodKey]) : 0,
      signups: users ? readNumber(users, [periodKey]) : 0,
      stories: stories ? readNumber(stories, [periodKey]) : 0,
    };
  }

  return {
    all: getMetrics("total"),
    day: getMetrics("today"),
    month: getMetrics("month"),
    year: getMetrics("year"),
  };
}

function normalizeReportStatus(value: string | null): AdminReportStatus {
  if (
    value === "pending" ||
    value === "reviewed" ||
    value === "dismissed" ||
    value === "action_taken"
  ) {
    return value;
  }

  return "pending";
}

function normalizeReport(record: JsonRecord): AdminReport {
  const targetTypeValue = readString(record, ["target_type", "content_type", "type"]);
  const reporter = isRecord(record.reporter) ? record.reporter : null;
  const targetContent = isRecord(record.target_content) ? record.target_content : null;
  const targetAuthor = isRecord(record.target_author) ? record.target_author : null;

  return {
    authorNickname: targetAuthor
      ? readString(targetAuthor, ["nickname"])
      : targetContent
        ? readString(targetContent, ["author_nickname"])
        : readString(record, ["author_nickname", "target_author_nickname", "writer_nickname"]),
    createdAt:
      readString(record, ["created_at", "reported_at", "report_created_at"]) ??
      new Date(0).toISOString(),
    id: readString(record, ["id", "report_id"]) ?? "",
    previewText: targetContent
      ? readString(targetContent, ["content"])
      : readString(record, ["preview_text", "content_preview", "preview", "content"]),
    reporterNickname: reporter
      ? readString(reporter, ["nickname"])
      : readString(record, ["reporter_nickname", "reported_by_nickname"]),
    status: normalizeReportStatus(readString(record, ["status"]) ?? "pending"),
    targetAuthorNickname: targetAuthor
      ? readString(targetAuthor, ["nickname"])
      : readString(record, ["target_author_nickname", "author_nickname"]),
    targetType: targetTypeValue === "story" ? "story" : "post",
    thumbnailUrl: targetContent
      ? readString(targetContent, ["thumbnail_url"])
      : readString(record, ["thumbnail_url", "preview_image_url", "image_url"]),
  };
}

function normalizeAdminUser(record: JsonRecord): AdminUser {
  const role = readString(record, ["role"]);

  return {
    avatarUrl: readString(record, ["avatar_url"]),
    createdAt: readString(record, ["created_at", "joined_at"]) ?? new Date(0).toISOString(),
    email: readString(record, ["email"]),
    id: readString(record, ["id", "user_id"]) ?? "",
    nickname: readString(record, ["nickname"]) ?? "알 수 없음",
    postsCount: readNumber(record, ["posts_count", "post_count"]),
    reportedCount: readNumber(record, ["report_count", "reported_count", "reports_count"]),
    role:
      role === "admin" || role === "official" || role === "user" ? role : "user",
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc("get_admin_dashboard_stats");

  if (error) {
    throw new Error("대시보드 통계를 불러오지 못했습니다.");
  }

  return normalizeDashboardStats((data ?? null) as Json | null);
}

export async function getAdminReports(
  status: AdminReportFilter,
  limit: number,
  offset: number,
): Promise<AdminReport[]> {
  const data = await callRpcWithVariants<Json[] | null>("get_admin_reports", [
    { status, limit, offset },
    { p_status: status, p_limit: limit, p_offset: offset },
    { status_filter: status, limit_count: limit, offset_count: offset },
  ]);

  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter(isRecord).map(normalizeReport).filter((report) => Boolean(report.id));
}

export async function getAdminUsers(
  limit: number,
  offset: number,
  search: string,
): Promise<AdminUser[]> {
  const data = await callRpcWithVariants<Json[] | null>("get_admin_users", [
    { limit, offset, search },
    { p_limit: limit, p_offset: offset, p_search: search },
    { limit_count: limit, offset_count: offset, search_query: search },
  ]);

  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter(isRecord).map(normalizeAdminUser).filter((user) => Boolean(user.id));
}

export async function handleReport(
  reportId: string,
  action: AdminReportAction,
): Promise<void> {
  await callRpcWithVariants<Json | null>("handle_admin_report", [
    { report_id: reportId, action_type: action },
  ]);
}
