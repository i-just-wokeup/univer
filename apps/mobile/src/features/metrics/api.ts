import { getSupabaseMobileClient } from "../../lib/supabase";

// 지표 종류. DB metric_events.metric_type CHECK와 일치.
export type MetricType =
  | "reel_view"
  | "post_reach"
  | "profile_visit"
  | "link_click";

export type MetricCounts = {
  total: number;
  unique: number;
};

// 인사이트 조회 권한 게이트. 지금은 전체 공개(true).
// 나중에 승격/프리미엄만 보게 하려면 여기 조건만 교체하면 된다(예: user.isPromoted).
// 수집(record)은 항상 전체로 하므로, 나중에 게이트만 바꿔도 데이터는 그대로 보존된다.
export function canViewInsights(): boolean {
  return true;
}

// 지표 이벤트 1건 기록. 본인 제외/중복제거는 서버(record_metric)가 처리한다.
// 화면 흐름을 막지 않도록 실패는 조용히 무시(fire-and-forget).
export async function recordMetric(
  metricType: MetricType,
  targetId: string,
  ownerId: string,
): Promise<void> {
  try {
    const supabase = getSupabaseMobileClient();
    await supabase.rpc("record_metric", {
      p_metric_type: metricType,
      p_target_id: targetId,
      p_owner_id: ownerId,
    });
  } catch {
    // 지표 기록 실패는 사용자 흐름에 영향 주지 않는다.
  }
}

// 본인 지표 총합+고유 조회. 기간(YYYY-MM-DD)·대상 옵션.
export async function getMetricCounts(
  metricType: MetricType,
  options?: { targetId?: string; start?: string; end?: string },
): Promise<MetricCounts> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_metric_counts", {
    p_metric_type: metricType,
    p_target_id: options?.targetId,
    p_start: options?.start,
    p_end: options?.end,
  });

  if (error || !data || data.length === 0) {
    return { total: 0, unique: 0 };
  }

  const row = data[0];
  return { total: row.total ?? 0, unique: row.unique_actors ?? 0 };
}
