-- 홈피드 band 1(전교생 안 본 글)을 최신순에서 반감기 핫스코어순으로 전환한다.
-- 기존 4인자 함수와 5인자 함수가 함께 남으면 PostgREST RPC 오버로드가 모호해지므로
-- 기존 시그니처를 제거한 뒤 기본값이 있는 p_half_life_days를 추가한다.
DROP FUNCTION IF EXISTS public.get_feed_post_ids(
  double precision,
  integer,
  integer,
  double precision
);

CREATE FUNCTION public.get_feed_post_ids(
  p_seed           double precision,
  p_limit          integer DEFAULT 20,
  p_after_band     integer DEFAULT NULL,
  p_after_rank     double precision DEFAULT NULL,
  p_half_life_days double precision DEFAULT 5
)
RETURNS TABLE (post_id uuid, band integer, rank double precision)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH me AS (
    SELECT auth.uid() AS uid
  ),
  crew AS (
    SELECT CASE WHEN uc.requester_id = (SELECT uid FROM me)
                THEN uc.receiver_id ELSE uc.requester_id END AS crew_id
    FROM user_connections uc
    WHERE uc.status = 'accepted'
      AND (uc.requester_id = (SELECT uid FROM me) OR uc.receiver_id = (SELECT uid FROM me))
  ),
  blocked AS (
    SELECT blocked_id AS uid FROM blocks WHERE blocker_id = (SELECT uid FROM me)
    UNION
    SELECT blocker_id AS uid FROM blocks WHERE blocked_id = (SELECT uid FROM me)
  ),
  visible AS (
    SELECT p.id, p.user_id, p.created_at, p.likes_count, p.comments_count,
           EXISTS (SELECT 1 FROM post_impressions pi
                   WHERE pi.user_id = (SELECT uid FROM me) AND pi.post_id = p.id) AS seen,
           (p.user_id IN (SELECT crew_id FROM crew)) AS is_crew
    FROM posts p
    WHERE p.deleted_at IS NULL
      AND p.user_id NOT IN (SELECT uid FROM blocked)
  ),
  ranked AS (
    SELECT v.id AS post_id,
      CASE
        WHEN NOT v.seen AND v.is_crew THEN 0
        WHEN NOT v.seen               THEN 1
        ELSE 2
      END AS band,
      CASE
        WHEN NOT v.seen AND v.is_crew THEN extract(epoch FROM v.created_at)
        WHEN NOT v.seen THEN
          (v.likes_count + 2 * v.comments_count)::double precision
          * power(
              0.5,
              (extract(epoch FROM (now() - v.created_at)) / 86400.0) / p_half_life_days
            )
        ELSE (('x' || substr(md5(v.id::text || p_seed::text), 1, 8))::bit(32)::bigint)::double precision
      END AS rank
    FROM visible v
  )
  SELECT r.post_id, r.band, r.rank
  FROM ranked r
  WHERE p_after_band IS NULL
     OR r.band > p_after_band
     OR (r.band = p_after_band AND r.rank < p_after_rank)
  ORDER BY r.band ASC, r.rank DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_feed_post_ids(
  double precision,
  integer,
  integer,
  double precision,
  double precision
) TO authenticated;
