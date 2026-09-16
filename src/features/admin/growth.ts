export type GrowthStage = { key: string; count: number; rate: number | null };
export type GrowthCohort = {
  day: number; windowStart: number; windowEnd: number;
  eligible: number; retained: number; rate: number | null; churnRate: number | null;
};
export type AdminGrowthStats = {
  asOf: string;
  timezone: string;
  acquisition: { day1: number; day7: number; day30: number; total: number };
  content: {
    noReaction: { posts: number; silent: number; rate: number | null };
    firstReaction: { medianHours: number | null; measured: number };
    rewrite: { eligible: number; repeated: number; rate: number | null };
    northStar: { weekStart: string; authors: number }[];
  };
  activation: {
    stages: GrowthStage[];
    averageFirstPostHours: number | null;
    firstPostWithin7Days: number;
  };
  retention: {
    dau: number;
    dau7Average: number;
    wau: number;
    mau: number;
    stickiness: number | null;
    averageStickiness: number | null;
    cohorts: GrowthCohort[];
    resurrected: number;
  };
  powerUsers: { days: number; users: number }[];
};

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("성장 지표 응답 형식이 올바르지 않습니다.");
  }
  return value as Record<string, unknown>;
}

function number(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error("성장 지표의 숫자를 확인할 수 없습니다.");
  }
  return value;
}

function nullable(value: unknown): number | null {
  return value === null ? null : number(value);
}

function array(value: unknown, length: number): unknown[] {
  if (!Array.isArray(value) || value.length !== length) {
    throw new Error("성장 지표 항목이 누락되었습니다.");
  }
  return value;
}

// Missing/invalid data must never silently become a real-looking zero.
export function parseAdminGrowthStats(value: unknown): AdminGrowthStats {
  const root = object(value);
  const acquisition = object(root.acquisition);
  const activation = object(root.activation);
  const retention = object(root.retention);
  const content = object(root.content);
  const noReaction = object(content.noReaction);
  const firstReaction = object(content.firstReaction);
  const rewrite = object(content.rewrite);
  if (typeof root.asOf !== "string" || !Number.isFinite(Date.parse(root.asOf)) || root.timezone !== "Asia/Seoul") {
    throw new Error("성장 지표 집계 시각을 확인할 수 없습니다.");
  }
  return {
    asOf: root.asOf,
    timezone: root.timezone,
    acquisition: { day1: number(acquisition.day1), day7: number(acquisition.day7), day30: number(acquisition.day30), total: number(acquisition.total) },
    content: {
      noReaction: { posts: number(noReaction.posts), silent: number(noReaction.silent), rate: nullable(noReaction.rate) },
      firstReaction: { medianHours: nullable(firstReaction.medianHours), measured: number(firstReaction.measured) },
      rewrite: { eligible: number(rewrite.eligible), repeated: number(rewrite.repeated), rate: nullable(rewrite.rate) },
      northStar: array(content.northStar, 8).map((value, index, rows) => {
        const row = object(value);
        if (typeof row.weekStart !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.weekStart)
          || !Number.isFinite(Date.parse(row.weekStart))
          || new Date(row.weekStart).toISOString().slice(0, 10) !== row.weekStart
          || new Date(row.weekStart).getUTCDay() !== 1
          || (index > 0 && Date.parse(row.weekStart) - Date.parse(String(object(rows[index - 1]).weekStart)) !== 7 * 86400000)) {
          throw new Error("주간 반응 추이가 올바르지 않습니다.");
        }
        return { weekStart: row.weekStart, authors: number(row.authors) };
      }),
    },
    activation: {
      stages: array(activation.stages, 5).map((value, index) => {
        const row = object(value);
        const key = ["signup", "feed", "post", "like", "crew"][index];
        if (row.key !== key) throw new Error("활성화 단계가 올바르지 않습니다.");
        return { key, count: number(row.count), rate: nullable(row.rate) };
      }),
      averageFirstPostHours: nullable(activation.averageFirstPostHours),
      firstPostWithin7Days: number(activation.firstPostWithin7Days),
    },
    retention: {
      dau: number(retention.dau), dau7Average: number(retention.dau7Average),
      wau: number(retention.wau), mau: number(retention.mau),
      stickiness: nullable(retention.stickiness), averageStickiness: nullable(retention.averageStickiness),
      resurrected: number(retention.resurrected),
      cohorts: array(retention.cohorts, 3).map((value, index) => {
        const row = object(value);
        const day = [1, 7, 30][index];
        if (row.day !== day) throw new Error("잔존 기간이 올바르지 않습니다.");
        const windowStart = [1, 5, 28][index];
        if (row.windowStart !== windowStart || row.windowEnd !== day) throw new Error("잔존 판정 구간이 올바르지 않습니다.");
        return { day, windowStart, windowEnd: day, eligible: number(row.eligible),
          retained: number(row.retained), rate: nullable(row.rate), churnRate: nullable(row.churnRate) };
      }),
    },
    powerUsers: array(root.powerUsers, 30).map((value, index) => {
      const row = object(value);
      if (row.days !== index + 1) throw new Error("활동일수 분포가 올바르지 않습니다.");
      return { days: index + 1, users: number(row.users) };
    }),
  };
}
