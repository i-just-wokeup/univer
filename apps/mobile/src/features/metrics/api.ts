import { getSupabaseMobileClient } from "../../lib/supabase";

// ── 인사이트 지표 용어 ──
// 조회(views) = 열람/재생 총 횟수 (post_view 상세 열림 + reel_view 재생)
// 도달(reach) = 피드에서 본 고유 계정 수 (post_impressions distinct)
// 상호작용 = 좋아요 + 댓글 + 저장 + 공유 합
// 영상 시청 = 완주율·평균 시청깊이·평균 반복·유지율 곡선 (영상 게시물만)
// 위치: 개요 탭=계정 전체 기간별 / 콘텐츠 탭=전체 누적+게시물별 / 게시물 상세=그 글 지표

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

export type ReelWatchEvent = {
  completed: boolean;
  eventId: string;
  loops: number;
  maxPct: number;
  postId: string;
  videoDurationMs: number;
};

// 지표 이벤트 1건 기록. 본인 제외/중복제거는 서버(record_metric)가 처리한다.
// 화면 흐름을 막지 않도록 실패는 조용히 무시(fire-and-forget).
export async function recordMetric(
  metricType: MetricType,
  targetId: string,
): Promise<void> {
  try {
    const supabase = getSupabaseMobileClient();
    await supabase.rpc("record_metric", {
      p_metric_type: metricType,
      p_target_id: targetId,
    });
  } catch {
    // 지표 기록 실패는 사용자 흐름에 영향 주지 않는다.
  }
}

// 릴스 활성 구간 1회를 기록한다. 서버가 실제 게시물 owner와 본인 시청 여부를 재검증한다.
// 지표 기록 실패는 재생 흐름을 막지 않도록 조용히 무시한다.
export async function recordReelWatch(event: ReelWatchEvent): Promise<void> {
  try {
    const supabase = getSupabaseMobileClient();
    await supabase.rpc("record_reel_watch", {
      p_completed: event.completed,
      p_event_id: event.eventId,
      p_loops: event.loops,
      p_max_pct: event.maxPct,
      p_post_id: event.postId,
      p_video_duration_ms: event.videoDurationMs,
    });
  } catch {
    // 지표 기록 실패는 사용자 흐름에 영향 주지 않는다.
  }
}

// 조회·프로필 방문·링크 클릭 이벤트의 총 횟수와 이벤트 내 고유 행동 계정을 센다.
// 인사이트의 도달은 이 함수의 unique가 아니라 getPostImpressionReach를 사용한다.
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

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
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

// 조회·프로필 방문·링크 클릭 이벤트를 KST 날짜별 total/unique로 센다.
// 이벤트 없는 날은 빠져서 오므로
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

  if (error) {
    throw error;
  }

  if (!data) {
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

export type PostImpressionReach = {
  daily: { day: string; unique: number }[];
  total: number;
};

// 도달=피드 노출 고유 계정(post_impressions), "연 사람"인 조회와 다르다.
export async function getPostImpressionReach(options: {
  start: string;
  end: string;
}): Promise<PostImpressionReach> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_post_impression_reach", {
    p_start: options.start,
    p_end: options.end,
  });

  if (error) {
    throw error;
  }

  return {
    daily: (data ?? []).map((row) => ({
      day: row.day,
      unique: row.daily_unique ?? 0,
    })),
    total: data?.[0]?.period_unique ?? 0,
  };
}

// 상호작용=내 게시물의 좋아요+댓글+저장+공유 합을 KST 날짜별로 센다.
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

// 조회를 릴스·일반 게시물·스토리 유형별 총 횟수로 나눈다.
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

export type PostInsight = {
  avgDepth: number | null;
  avgLoops: number | null;
  comments: number;
  completionRate: number | null;
  createdAt: string;
  isVideo: boolean;
  likes: number;
  postId: string;
  reach: number;
  saves: number;
  shares: number;
  thumbnailUrl: string | null;
  videoDurationMs: number | null;
  views: number;
};

export type PostRetentionPoint = {
  bucketPct: number;
  retention: number;
};

// 승격(크리에이터) 콘텐츠 성과 — 본인 게시물별 상호작용(좋아요·댓글·저장·공유).
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

// 한 게시물의 조회·피드 도달·상호작용과 영상 시청 지표를 함께 조회한다.
export async function getPostInsight(
  postId: string,
): Promise<PostInsight | null> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_post_insight", {
    p_post_id: postId,
  });

  if (error) {
    throw error;
  }

  const row = data?.[0];
  if (!row) {
    return null;
  }

  return {
    avgDepth: row.avg_depth === null ? null : Number(row.avg_depth),
    avgLoops: row.avg_loops === null ? null : Number(row.avg_loops),
    comments: row.comments ?? 0,
    completionRate:
      row.completion_rate === null ? null : Number(row.completion_rate),
    createdAt: row.created_at,
    isVideo: row.is_video,
    likes: row.likes ?? 0,
    postId: row.post_id,
    reach: row.reach ?? 0,
    saves: row.saves ?? 0,
    shares: row.shares ?? 0,
    thumbnailUrl: row.thumbnail_url,
    videoDurationMs: row.video_duration_ms,
    views: row.views ?? 0,
  };
}

export async function getPostRetention(
  postId: string,
): Promise<PostRetentionPoint[]> {
  const supabase = getSupabaseMobileClient();
  const { data, error } = await supabase.rpc("get_post_retention", {
    p_post_id: postId,
  });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    bucketPct: row.bucket_pct,
    retention: Number(row.retention),
  }));
}
