import { useCallback, useEffect, useRef, useState } from "react";

import {
  getEngagementDaily,
  getMetricCounts,
  getMetricDaily,
  getPostImpressionReach,
  getViewsByType,
  type MetricCounts,
  type MetricDailyPoint,
  type MetricType,
  type ViewsByType,
} from "./api";

export type InsightPeriod = "day" | "week" | "month";
export type InsightMetricKey =
  | "views"
  | "engagement"
  | "reach"
  | "profile"
  | "link";

export type InsightBar = {
  day: string;
  value: number;
};

export type InsightMetric = {
  bars: InsightBar[];
  changePercent: number;
  key: InsightMetricKey;
  label: string;
  value: number;
};

type MetricBundle = {
  current: MetricCounts;
  daily: MetricDailyPoint[];
  previous: MetricCounts;
};

const RANGE_DAYS: Record<InsightPeriod, number> = {
  day: 1,
  week: 7,
  month: 30,
};

function seoulToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

function seoulDateBefore(days: number): string {
  const base = new Date(`${seoulToday()}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() - days);
  return base.toISOString().slice(0, 10);
}

function rangeFor(period: InsightPeriod): { start: string; end: string } {
  const days = RANGE_DAYS[period];
  return { start: seoulDateBefore(days - 1), end: seoulToday() };
}

function prevRangeFor(period: InsightPeriod): { start: string; end: string } {
  const days = RANGE_DAYS[period];
  return { start: seoulDateBefore(days * 2 - 1), end: seoulDateBefore(days) };
}

function dayList(start: string, end: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);

  while (cursor <= last) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

function changePercent(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return Math.round(((current - previous) / previous) * 100);
}

function barsFrom(
  days: string[],
  points: MetricDailyPoint[],
  field: "total" | "unique",
): InsightBar[] {
  const values = new Map(points.map((point) => [point.day, point[field]]));
  return days.map((day) => ({ day, value: values.get(day) ?? 0 }));
}

function combineBars(days: string[], ...series: InsightBar[][]): InsightBar[] {
  return days.map((day, index) => ({
    day,
    value: series.reduce((sum, bars) => sum + (bars[index]?.value ?? 0), 0),
  }));
}

async function loadMetric(
  type: MetricType,
  currentRange: { start: string; end: string },
  previousRange: { start: string; end: string },
): Promise<MetricBundle> {
  const [current, previous, daily] = await Promise.all([
    getMetricCounts(type, currentRange),
    getMetricCounts(type, previousRange),
    getMetricDaily(type, currentRange),
  ]);
  return { current, daily, previous };
}

function formatRangeDate(value: string): string {
  const [, month, day] = value.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

export function useInsights(includeEngagement: boolean) {
  const requestIdRef = useRef(0);
  const [period, setPeriod] = useState<InsightPeriod>("week");
  const [metrics, setMetrics] = useState<InsightMetric[]>([]);
  const [viewsByType, setViewsByType] = useState<ViewsByType>({
    post: 0,
    reel: 0,
    story: 0,
  });
  const [dateRangeLabel, setDateRangeLabel] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setErrorMessage("");

    const currentRange = rangeFor(period);
    const previousRange = prevRangeFor(period);
    const days = dayList(currentRange.start, currentRange.end);
    setDateRangeLabel(
      currentRange.start === currentRange.end
        ? formatRangeDate(currentRange.start)
        : `${formatRangeDate(currentRange.start)} ~ ${formatRangeDate(currentRange.end)}`,
    );

    try {
      const engagementPromise = includeEngagement
        ? Promise.all([
            getEngagementDaily(currentRange),
            getEngagementDaily(previousRange),
          ])
        : Promise.resolve([[], []] as const);
      const reachPromise = includeEngagement
        ? Promise.all([
            getPostImpressionReach(currentRange),
            getPostImpressionReach(previousRange),
          ])
        : Promise.resolve(null);
      const [reel, post, profile, link, engagement, reach, typeViews] =
        await Promise.all([
          loadMetric("reel_view", currentRange, previousRange),
          loadMetric("post_view", currentRange, previousRange),
          loadMetric("profile_visit", currentRange, previousRange),
          loadMetric("link_click", currentRange, previousRange),
          engagementPromise,
          reachPromise,
          getViewsByType(currentRange),
        ]);

      if (requestId !== requestIdRef.current) {
        return;
      }

      const reelTotalBars = barsFrom(days, reel.daily, "total");
      const postTotalBars = barsFrom(days, post.daily, "total");
      const profileBars = barsFrom(days, profile.daily, "total");
      const linkBars = barsFrom(days, link.daily, "total");
      const currentEngagement = engagement[0].reduce(
        (sum, point) => sum + point.total,
        0,
      );
      const previousEngagement = engagement[1].reduce(
        (sum, point) => sum + point.total,
        0,
      );
      const engagementMap = new Map(
        engagement[0].map((point) => [point.day, point.total]),
      );
      const reachMap = new Map(
        (reach?.[0].daily ?? []).map((point) => [point.day, point.unique]),
      );

      const nextMetrics: InsightMetric[] = [
        {
          bars: combineBars(days, reelTotalBars, postTotalBars),
          changePercent: changePercent(
            reel.current.total + post.current.total,
            reel.previous.total + post.previous.total,
          ),
          key: "views",
          label: "조회",
          value: reel.current.total + post.current.total,
        },
        ...(includeEngagement
          ? [{
              bars: days.map((day) => ({
                day,
                value: engagementMap.get(day) ?? 0,
              })),
              changePercent: changePercent(
                currentEngagement,
                previousEngagement,
              ),
              key: "engagement" as const,
              label: "상호작용",
              value: currentEngagement,
            }]
          : []),
        ...(includeEngagement
          ? [{
              bars: days.map((day) => ({
                day,
                value: reachMap.get(day) ?? 0,
              })),
              changePercent: changePercent(
                reach?.[0].total ?? 0,
                reach?.[1].total ?? 0,
              ),
              key: "reach" as const,
              label: "도달",
              value: reach?.[0].total ?? 0,
            }]
          : []),
        {
          bars: profileBars,
          changePercent: changePercent(
            profile.current.total,
            profile.previous.total,
          ),
          key: "profile",
          label: "프로필 방문",
          value: profile.current.total,
        },
        {
          bars: linkBars,
          changePercent: changePercent(
            link.current.total,
            link.previous.total,
          ),
          key: "link",
          label: "링크 클릭",
          value: link.current.total,
        },
      ];

      setMetrics(nextMetrics);
      setViewsByType(typeViews);
    } catch {
      if (requestId === requestIdRef.current) {
        setErrorMessage("지표를 불러오지 못했습니다.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [includeEngagement, period]);

  useEffect(() => {
    void load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  return {
    dateRangeLabel,
    errorMessage,
    isLoading,
    metrics,
    period,
    reload: load,
    setPeriod,
    viewsByType,
  };
}
