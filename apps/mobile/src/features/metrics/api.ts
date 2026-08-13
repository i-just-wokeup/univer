import { getSupabaseMobileClient } from "../../lib/supabase";

// 지표 종류. DB metric_events.metric_type CHECK와 일치.
export type MetricType =
  | "reel_view"
  | "post_view"
  | "profile_visit"
  | "link_click";

export type MetricCounts = {
  total: number;
  unique: number;
};

// 인사이트 화면 진입은 전체 계정에 허용한다. 콘텐츠 탭은 화면에서 기관·승격 배지로 별도 게이트한다.
// 수집(record)은 계정 종류와 무관하게 유지해 승격 전 데이터도 보존한다.
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

export type MetricDailyPoint = {
  day: string;
  total: number;
  unique: number;
};

// 본인 지표를 날짜(KST)별로 조회. 일별 막대그래프용. 이벤트 없는 날은 빠져서 오므로
// 화면 쪽에서 날짜 축을 채운다.
export async function getMetricDaily(
  metricType: MetricType,
  options: { start: string; end: string; targetId?: string },
): Promise<MetricDailyPoint[]> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_metric_daily", {
    p_metric_type: metricType,
    p_target_id: options.targetId,
    p_start: options.start,
    p_end: options.end,
  });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    day: row.day,
    total: row.total ?? 0,
    unique: row.unique_actors ?? 0,
  }));
}

export type EngagementDailyPoint = {
  day: string;
  total: number;
};

export async function getEngagementDaily(options: {
  start: string;
  end: string;
}): Promise<EngagementDailyPoint[]> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_engagement_daily", {
    p_start: options.start,
    p_end: options.end,
  });

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  return data.map((row) => ({
    day: row.day,
    total: row.total ?? 0,
  }));
}

export type ViewsByType = {
  post: number;
  reel: number;
  story: number;
};

export async function getViewsByType(options: {
  start: string;
  end: string;
}): Promise<ViewsByType> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_views_by_type", {
    p_start: options.start,
    p_end: options.end,
  });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return { post: 0, reel: 0, story: 0 };
  }

  const row = data[0];
  return {
    post: row.post ?? 0,
    reel: row.reel ?? 0,
    story: row.story ?? 0,
  };
}

export type ContentPerformance = {
  postId: string;
  createdAt: string;
  thumbnailUrl: string | null;
  isVideo: boolean;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
};

// 승격(크리에이터) 콘텐츠 성과 — 본인 게시물별 좋아요·댓글·저장·공유.
// DB get_content_performance RPC(본인 글만, SECURITY DEFINER)를 UI 타입으로 매핑.
export async function getContentPerformance(): Promise<ContentPerformance[]> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_content_performance");

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  return data.map((row) => ({
    postId: row.post_id,
    createdAt: row.created_at,
    thumbnailUrl: row.thumbnail_url,
    isVideo: row.is_video,
    likes: row.likes ?? 0,
    comments: row.comments ?? 0,
    saves: row.saves ?? 0,
    shares: row.shares ?? 0,
  }));
}
