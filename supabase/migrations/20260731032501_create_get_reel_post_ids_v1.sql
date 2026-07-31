-- 릴스(영상 전용) 순서 함수 v1: 순서(정렬된 post id 목록)만 반환. 내용은 앱이 기존 임베딩으로 채움.
-- 규칙(설계 §8, 2026-07-31 확정): 크루 구분 없이 다 섞기.
--   band 0 = 세션에서 안 본 영상(시드 셔플) → band 1 = 세션에서 본 영상(시드 셔플, 무한 루프용).
-- "본 것"은 세션 개념이라 DB 저장 없이 앱(클라)이 이번 세션에 본 릴스 id를 p_seen_ids로 넘긴다.
-- 가중치/완주율/개인화 추천은 나중(데이터 쌓인 뒤). 지금은 안 본 거 먼저 + 셔플 + 무한 뼈대만.
-- SECURITY INVOKER → posts RLS(같은 학교 + 공개범위)가 자동 적용. 차단만 함수에서 제외. 영상 게시물만.
CREATE OR REPLACE FUNCTION public.get_reel_post_ids(
  p_seed       double precision,
  p_seen_ids   uuid[] DEFAULT '{}',
  p_limit      integer DEFAULT 20,
  p_after_band integer DEFAULT NULL,
  p_after_rank double precision DEFAULT NULL
)
RETURNS TABLE (post_id uuid, band integer, rank double precision)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH me AS (
    SELECT auth.uid() AS uid
  ),
  blocked AS (
    SELECT blocked_id AS uid FROM blocks WHERE blocker_id = (SELECT uid FROM me)
    UNION
    SELECT blocker_id AS uid FROM blocks WHERE blocked_id = (SELECT uid FROM me)
  ),
  video_posts AS (
    SELECT DISTINCT p.id
    FROM posts p
    JOIN post_media pm ON pm.post_id = p.id AND pm.type = 'video'
    WHERE p.deleted_at IS NULL
      AND p.user_id NOT IN (SELECT uid FROM blocked)
  ),
  ranked AS (
    SELECT v.id AS post_id,
      CASE WHEN v.id = ANY(p_seen_ids) THEN 1 ELSE 0 END AS band,
      (('x' || substr(md5(v.id::text || p_seed::text), 1, 8))::bit(32)::bigint)::double precision AS rank
    FROM video_posts v
  )
  SELECT r.post_id, r.band, r.rank
  FROM ranked r
  WHERE p_after_band IS NULL
     OR r.band > p_after_band
     OR (r.band = p_after_band AND r.rank < p_after_rank)
  ORDER BY r.band ASC, r.rank DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_reel_post_ids(double precision, uuid[], integer, integer, double precision) TO authenticated;
