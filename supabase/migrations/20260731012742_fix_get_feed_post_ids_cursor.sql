-- get_feed_post_ids 커서 조건 수정.
-- 정렬이 (band ASC, rank DESC)이므로 다음 페이지 조건은:
--   band > after_band  OR  (band = after_band AND rank < after_rank).
-- 이전 버전의 튜플 비교 (band, rank) < (after_band, after_rank)는 band 방향이 뒤집혀 페이지네이션이 어긋났다.
CREATE OR REPLACE FUNCTION public.get_feed_post_ids(
  p_seed       double precision,
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
    SELECT p.id, p.user_id, p.created_at,
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
        WHEN NOT v.seen              THEN 1
        ELSE 2
      END AS band,
      CASE
        WHEN NOT v.seen THEN extract(epoch FROM v.created_at)
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

GRANT EXECUTE ON FUNCTION public.get_feed_post_ids(double precision, integer, integer, double precision) TO authenticated;
