-- 같은 학교 안에서 공통 크루와 같은 학과를 기준으로 크루 후보를 추천한다.
-- 연결·차단 관계 전체를 계산해야 하므로 SECURITY DEFINER를 사용하되,
-- 호출자를 auth.uid()로 고정하고 반환 필드를 공개 프로필 최소 정보로 제한한다.

CREATE INDEX IF NOT EXISTS idx_users_university_active
  ON public.users (university_id)
  WHERE deleted_at IS NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id
  ON public.blocks (blocked_id);

CREATE OR REPLACE FUNCTION public.get_friend_recommendations(
  p_limit integer DEFAULT 20
)
RETURNS TABLE(
  user_id uuid,
  nickname text,
  avatar_url text,
  mutual_count integer,
  same_dept boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  WITH viewer AS (
    SELECT u.id, u.university_id, u.department
    FROM public.users u
    WHERE u.id = v_user_id
      AND u.deleted_at IS NULL
      AND u.is_active = true
  ),
  accepted_edges AS (
    SELECT uc.requester_id AS user_id, uc.receiver_id AS crew_id
    FROM public.user_connections uc
    WHERE uc.status = 'accepted'
    UNION
    SELECT uc.receiver_id AS user_id, uc.requester_id AS crew_id
    FROM public.user_connections uc
    WHERE uc.status = 'accepted'
  ),
  my_crew AS (
    SELECT ae.crew_id
    FROM accepted_edges ae
    WHERE ae.user_id = v_user_id
  ),
  scored_candidates AS (
    SELECT
      candidate.id AS user_id,
      candidate.nickname,
      candidate.avatar_url,
      COUNT(DISTINCT candidate_crew.crew_id)
        FILTER (WHERE mine.crew_id IS NOT NULL)::integer AS mutual_count,
      (candidate.department = viewer.department) AS same_dept
    FROM viewer
    JOIN public.users candidate
      ON candidate.university_id = viewer.university_id
     AND candidate.id <> viewer.id
     AND candidate.deleted_at IS NULL
     AND candidate.is_active = true
    LEFT JOIN accepted_edges candidate_crew
      ON candidate_crew.user_id = candidate.id
    LEFT JOIN my_crew mine
      ON mine.crew_id = candidate_crew.crew_id
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.user_connections existing
      WHERE existing.status IN ('accepted', 'pending')
        AND (
          (existing.requester_id = viewer.id AND existing.receiver_id = candidate.id)
          OR
          (existing.requester_id = candidate.id AND existing.receiver_id = viewer.id)
        )
    )
      AND NOT EXISTS (
        SELECT 1
        FROM public.blocks blocked
        WHERE (blocked.blocker_id = viewer.id AND blocked.blocked_id = candidate.id)
           OR (blocked.blocker_id = candidate.id AND blocked.blocked_id = viewer.id)
      )
    GROUP BY
      candidate.id,
      candidate.nickname,
      candidate.avatar_url,
      candidate.department,
      viewer.department
  )
  SELECT
    scored.user_id,
    scored.nickname,
    scored.avatar_url,
    scored.mutual_count,
    scored.same_dept
  FROM scored_candidates scored
  WHERE scored.mutual_count > 0 OR scored.same_dept
  ORDER BY
    (scored.mutual_count * 3 + CASE WHEN scored.same_dept THEN 1 ELSE 0 END) DESC,
    scored.mutual_count DESC,
    scored.user_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);
END;
$function$;

REVOKE ALL ON FUNCTION public.get_friend_recommendations(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_friend_recommendations(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_friend_recommendations(integer) TO authenticated;
