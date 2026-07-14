import { useCallback, useEffect, useState } from "react";

import type { MetricType } from "./api";
import { getMetricCounts, getMetricDaily } from "./api";

export type InsightPeriod = "day" | "week" | "month";

export type InsightBar = {
  day: string;
  value: number;
};

export type InsightMetric = {
  type: MetricType;
  label: string;
  hint: string;
  value: number;
  // 직전 동일 기간 대비 증감률(%). 비교 불가(직전 0)면 null.
  changePercent: number | null;
  // 일별 막대용. 이벤트 없는 날도 0으로 채워진 연속 배열.
  bars: InsightBar[];
};

// 인사이트에 보여줄 지표 정의. use: 숫자/막대에 쓸 값(total=총 횟수, unique=고유 계정 수).
const METRIC_DEFS: {
  type: MetricType;
  label: string;
  hint: string;
  use: "total" | "unique";
}[] = [
  {
    type: "reel_view",
    label: "릴스 조회수",
    hint: "릴스가 재생된 총 횟수",
    use: "total",
  },
  {
    type: "post_view",
    label: "게시물 조회",
    hint: "게시물 상세를 연 횟수",
    use: "total",
  },
  {
    type: "profile_visit",
    label: "프로필 방문",
    hint: "내 프로필을 열어본 횟수",
    use: "total",
  },
  {
    type: "link_click",
    label: "링크 클릭",
    hint: "프로필 링크를 누른 횟수",
    use: "total",
  },
];

const RANGE_DAYS: Record<InsightPeriod, number> = {
  day: 1,
  week: 7,
  month: 30,
};

// KST 기준 오늘(YYYY-MM-DD). 지표는 event_date를 KST로 저장하므로 조회도 KST로 맞춘다.
function seoulToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

// KST 오늘에서 days일 전(YYYY-MM-DD).
function seoulDateBefore(days: number): string {
  const base = new Date(`${seoulToday()}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() - days);
  return base.toISOString().slice(0, 10);
}

// 조회 기간(양끝 포함).
function rangeFor(period: InsightPeriod): { start: string; end: string } {
  const days = RANGE_DAYS[period];
  return { start: seoulDateBefore(days - 1), end: seoulToday() };
}

// 직전 동일 길이 기간(증감률 비교용).
function prevRangeFor(period: InsightPeriod): { start: string; end: string } {
  const days = RANGE_DAYS[period];
  return { start: seoulDateBefore(days * 2 - 1), end: seoulDateBefore(days) };
}

// start~end(포함) 사이 날짜 문자열 배열.
function dayList(start: string, end: string): string[] {
  const out: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor <= last) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

function changePercent(current: number, previous: number): number | null {
  if (previous <= 0) {
    return null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

export function useInsights() {
  const [period, setPeriod] = useState<InsightPeriod>("week");
  const [metrics, setMetrics] = useState<InsightMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    const { start, end } = rangeFor(period);
    const prev = prevRangeFor(period);
    const days = dayList(start, end);

    try {
      const results = await Promise.all(
        METRIC_DEFS.map(async (def) => {
          const [current, previous, daily] = await Promise.all([
            getMetricCounts(def.type, { start, end }),
            getMetricCounts(def.type, { start: prev.start, end: prev.end }),
            getMetricDaily(def.type, { start, end }),
          ]);

          const dailyMap = new Map(
            daily.map((point) => [
              point.day,
              def.use === "unique" ? point.unique : point.total,
            ]),
          );

          const value = def.use === "unique" ? current.unique : current.total;
          const prevValue =
            def.use === "unique" ? previous.unique : previous.total;

          return {
            type: def.type,
            label: def.label,
            hint: def.hint,
            value,
            changePercent: changePercent(value, prevValue),
            bars: days.map((day) => ({ day, value: dailyMap.get(day) ?? 0 })),
          } satisfies InsightMetric;
        }),
      );

      setMetrics(results);
    } catch {
      setErrorMessage("지표를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    period,
    setPeriod,
    metrics,
    isLoading,
    errorMessage,
    reload: load,
  };
}
