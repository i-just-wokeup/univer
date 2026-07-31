-- 홈피드 순서 함수 v1: "순서(정렬된 post id 목록)"만 반환. 내용(작성자/미디어)은 앱이 기존 임베딩 쿼리로 채운다.
-- 순서: band 0 = 크루 안 본 최신 → band 1 = 전교생 안 본 최신 → band 2 = 본 글 랜덤 꼬리(시드 고정).
-- SECURITY INVOKER(기본) → posts RLS(같은 학교 + public/크루공개 판정)가 자동 적용되어 공개범위 안전.
-- 차단만 함수에서 추가 제외. 페이지네이션은 (band, rank) 커서로 스크롤 안정.
-- ⚠️ 이 파일의 커서 조건에는 버그가 있었고 20260731012742에서 수정됨(정렬 (band ASC, rank DESC) ↔ 튜플 < 불일치).
--    최신 정의는 20260731012742 참고.
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
     OR (r.band, r.rank) < (p_after_band, p_after_rank)
  ORDER BY r.band ASC, r.rank DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_feed_post_ids(double precision, integer, integer, double precision) TO authenticated;
