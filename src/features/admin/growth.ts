export type GrowthStage = { key: string; count: number; rate: number | null };
export type GrowthCohort = { day: number; eligible: number; retained: number; rate: number | null };
export type AdminGrowthStats = {
  asOf: string;
  timezone: string;
  acquisition: { today: number; week: number; total: number };
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
  if (typeof root.asOf !== "string" || !Number.isFinite(Date.parse(root.asOf)) || root.timezone !== "Asia/Seoul") {
    throw new Error("성장 지표 집계 시각을 확인할 수 없습니다.");
  }
  return {
    asOf: root.asOf,
    timezone: root.timezone,
    acquisition: { today: number(acquisition.today), week: number(acquisition.week), total: number(acquisition.total) },
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
        return { day, eligible: number(row.eligible), retained: number(row.retained), rate: nullable(row.rate) };
      }),
    },
    powerUsers: array(root.powerUsers, 30).map((value, index) => {
      const row = object(value);
      if (row.days !== index + 1) throw new Error("활동일수 분포가 올바르지 않습니다.");
      return { days: index + 1, users: number(row.users) };
    }),
  };
}
