-- 인기 게시물 순위 RPC (탐색 그리드 + 검색 인기 차트 공용).
-- 규칙: 기간 제한 없음(전체) · 전체공개 · 내 글 제외 · 차단 제외 · 미디어 있는 글 · 한 사람 최대 2개.
-- 핫스코어 = (좋아요 + 댓글*2) × 0.5^(경과시간h / half_life_hours)
--   · 참여도(좋아요·댓글)에 시간 반감기 감쇠를 곱한다. 참여 0이면 0점.
--   · half_life_hours마다 인기 가중치가 반토막 → 최근일수록 유리하지만 오래된 글도 인기 높으면 노출됨.
--   · 기본 120h(5일). 작을수록 최근 우위, 클수록 인기 우위.
-- SECURITY INVOKER(기본)라 posts RLS(같은 학교 + 공개범위) 자동 적용. 내용은 앱이 이 순서로 채운다.

CREATE OR REPLACE FUNCTION public.get_popular_post_ids(
  p_limit int DEFAULT 30,
  p_offset int DEFAULT 0,
  p_half_life_hours float8 DEFAULT 120
)
RETURNS TABLE(post_id uuid, score float8)
LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
  WITH me AS (SELECT auth.uid() AS uid),
  blocked AS (
    SELECT blocked_id AS uid FROM blocks WHERE blocker_id = (SELECT uid FROM me)
    UNION
    SELECT blocker_id AS uid FROM blocks WHERE blocked_id = (SELECT uid FROM me)
  ),
  scored AS (
    SELECT p.id AS post_id, p.user_id, p.created_at,
           ( (p.likes_count + 2 * p.comments_count)
             * power(0.5, (extract(epoch FROM (now() - p.created_at)) / 3600.0) / p_half_life_hours)
           )::float8 AS score
    FROM posts p
    WHERE p.deleted_at IS NULL
      AND p.visibility = 'public'
      AND p.user_id <> (SELECT uid FROM me)
      AND p.user_id NOT IN (SELECT uid FROM blocked)
      AND EXISTS (SELECT 1 FROM post_media pm WHERE pm.post_id = p.id)
  ),
  capped AS (
    SELECT s.post_id, s.score, s.created_at,
           row_number() OVER (
             PARTITION BY s.user_id ORDER BY s.score DESC, s.created_at DESC
           ) AS per_user_rank
    FROM scored s
  )
  SELECT c.post_id, c.score
  FROM capped c
  WHERE c.per_user_rank <= 2
  ORDER BY c.score DESC, c.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$function$;

grant execute on function public.get_popular_post_ids(int, int, float8) to authenticated, anon;
