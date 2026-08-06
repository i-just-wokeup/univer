-- 인기 게시물 순위 RPC (탐색 + 검색 인기 그리드 공용).
-- 핫스코어 = ln(1 + 좋아요 + 댓글*2) - 경과시간(h)/recency_hours
--   · 참여도(좋아요·댓글)는 로그로 반영(한 글이 영구 도배 방지), 참여 없으면 0에서 시작.
--   · 최근일수록 감점 적음(오래되면 감점 큼). recency_hours 클수록 인기 우위, 작을수록 최근 우위.
-- SECURITY INVOKER(기본)라 posts RLS(같은 학교 + 공개범위)가 자동 적용. 여기선 전체공개(public)만.
-- 차단 유저는 함수 내 blocked CTE로 제외. 내용(작성자·미디어)은 앱이 이 순서로 채운다.

CREATE OR REPLACE FUNCTION public.get_popular_post_ids(
  p_limit int DEFAULT 30,
  p_offset int DEFAULT 0,
  p_recency_hours float8 DEFAULT 240
)
RETURNS TABLE(post_id uuid, score float8)
LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
  WITH me AS (SELECT auth.uid() AS uid),
  blocked AS (
    SELECT blocked_id AS uid FROM blocks WHERE blocker_id = (SELECT uid FROM me)
    UNION
    SELECT blocker_id AS uid FROM blocks WHERE blocked_id = (SELECT uid FROM me)
  )
  SELECT p.id AS post_id,
         ( ln(1 + p.likes_count + 2 * p.comments_count)
           - (extract(epoch FROM (now() - p.created_at)) / 3600.0) / p_recency_hours
         )::float8 AS score
  FROM posts p
  WHERE p.deleted_at IS NULL
    AND p.visibility = 'public'
    AND p.user_id NOT IN (SELECT uid FROM blocked)
    AND EXISTS (SELECT 1 FROM post_media pm WHERE pm.post_id = p.id)
  ORDER BY score DESC, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$function$;

grant execute on function public.get_popular_post_ids(int, int, float8) to authenticated, anon;
