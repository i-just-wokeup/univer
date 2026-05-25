"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  getDashboardStats,
  type AdminPeriod,
  type DashboardMetricCounts,
  type DashboardStats,
} from "@/features/admin/api";

const PERIOD_TABS: Array<{ label: string; value: AdminPeriod }> = [
  { label: "일", value: "day" },
  { label: "월", value: "month" },
  { label: "년", value: "year" },
  { label: "전체", value: "all" },
];

const KPI_ITEMS: Array<{ key: keyof DashboardMetricCounts; label: string }> = [
  { key: "signups", label: "신규가입" },
  { key: "posts", label: "게시물" },
  { key: "stories", label: "스토리" },
  { key: "comments", label: "댓글" },
  { key: "likes", label: "좋아요" },
  { key: "pendingReports", label: "미처리신고" },
];

const EMPTY_STATS: DashboardStats = {
  all: {
    comments: 0,
    likes: 0,
    pendingReports: 0,
    posts: 0,
    signups: 0,
    stories: 0,
  },
  day: {
    comments: 0,
    likes: 0,
    pendingReports: 0,
    posts: 0,
    signups: 0,
    stories: 0,
  },
  month: {
    comments: 0,
    likes: 0,
    pendingReports: 0,
    posts: 0,
    signups: 0,
    stories: 0,
  },
  year: {
    comments: 0,
    likes: 0,
    pendingReports: 0,
    posts: 0,
    signups: 0,
    stories: 0,
  },
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-3xl border border-zinc-200 bg-white p-6"
        >
          <div className="h-4 w-24 rounded-full bg-zinc-100" />
          <div className="mt-5 h-10 w-32 rounded-full bg-zinc-100" />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<AdminPeriod>("day");
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async (showRefreshing = false) => {
    try {
      setError(null);
      setIsLoading(!showRefreshing);
      setIsRefreshing(showRefreshing);

      const nextStats = await getDashboardStats();
      setStats(nextStats);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "대시보드 통계를 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadStats();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadStats]);

  const currentMetrics = stats[period];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-zinc-200 bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950">대시보드</h1>
          <p className="mt-2 text-sm text-zinc-500">
            신고, 가입, 콘텐츠 생성 현황을 한 번에 확인합니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-2xl bg-zinc-100 p-1">
            {PERIOD_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setPeriod(tab.value)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  period === tab.value
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-950"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              void loadStats(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {KPI_ITEMS.map((item) => (
            <div
              key={item.key}
              className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-semibold text-zinc-500">{item.label}</p>
              <p className="mt-5 text-4xl font-bold tracking-tight text-zinc-950">
                {formatNumber(currentMetrics[item.key])}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
