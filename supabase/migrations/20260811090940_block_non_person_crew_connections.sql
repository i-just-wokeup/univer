-- 크루는 일반 개인 계정끼리만 맺는다.
-- 기관 계정과 승격 계정은 추천·신청·수락 단계에서 모두 차단한다.

CREATE OR REPLACE FUNCTION public.get_friend_recommendations(
  p_limit integer DEFAULT 20,
  p_seed double precision DEFAULT 0
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
      COALESCE(candidate.department = viewer.department, false) AS same_dept
    FROM viewer
    JOIN public.users candidate
      ON candidate.university_id = viewer.university_id
     AND candidate.id <> viewer.id
     AND candidate.deleted_at IS NULL
     AND candidate.is_active = true
     AND candidate.is_promoted = false
    LEFT JOIN accepted_edges candidate_crew
      ON candidate_crew.user_id = candidate.id
    LEFT JOIN my_crew mine
      ON mine.crew_id = candidate_crew.crew_id
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.official_accounts oa
      WHERE oa.user_id = candidate.id
    )
      AND NOT EXISTS (
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
  ),
  ranked_candidates AS (
    SELECT
      scored.*,
      CASE
        WHEN scored.mutual_count > 0 THEN 1
        WHEN scored.same_dept THEN 2
        ELSE 3
      END AS tier
    FROM scored_candidates scored
  )
  SELECT
    ranked.user_id,
    ranked.nickname,
    ranked.avatar_url,
    ranked.mutual_count,
    ranked.same_dept
  FROM ranked_candidates ranked
  ORDER BY
    ranked.tier,
    CASE WHEN ranked.tier = 1 THEN ranked.mutual_count END DESC NULLS LAST,
    CASE WHEN ranked.tier = 2 THEN ranked.user_id END NULLS LAST,
    CASE WHEN ranked.tier = 3
      THEN md5(ranked.user_id::text || ':' || COALESCE(p_seed, 0)::text)
    END NULLS LAST,
    ranked.user_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);
END;
$function$;

CREATE OR REPLACE FUNCTION public.send_friend_request(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_uid = target_user_id THEN
    RAISE EXCEPTION '본인에게 신청할 수 없습니다.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.users participant
    WHERE participant.id IN (v_uid, target_user_id)
      AND (
        participant.is_promoted = true
        OR EXISTS (
          SELECT 1
          FROM public.official_accounts oa
          WHERE oa.user_id = participant.id
        )
      )
  ) THEN
    RAISE EXCEPTION '기관 또는 승격 계정은 크루 관계를 맺을 수 없습니다.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.user_connections
    WHERE (requester_id = v_uid AND receiver_id = target_user_id AND status = 'accepted')
       OR (requester_id = target_user_id AND receiver_id = v_uid AND status = 'accepted')
  ) THEN
    RAISE EXCEPTION '이미 친구입니다.';
  END IF;

  INSERT INTO public.user_connections (requester_id, receiver_id, status)
  VALUES (v_uid, target_user_id, 'pending')
  ON CONFLICT (requester_id, receiver_id)
  DO UPDATE SET status = 'pending', updated_at = now();

  RETURN json_build_object('success', true, 'status', 'pending');
END;
$function$;

CREATE OR REPLACE FUNCTION public.accept_friend_request(requester_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.users participant
    WHERE participant.id IN (v_uid, requester_user_id)
      AND (
        participant.is_promoted = true
        OR EXISTS (
          SELECT 1
          FROM public.official_accounts oa
          WHERE oa.user_id = participant.id
        )
      )
  ) THEN
    RAISE EXCEPTION '기관 또는 승격 계정은 크루 관계를 맺을 수 없습니다.';
  END IF;

  UPDATE public.user_connections
  SET status = 'accepted', updated_at = now()
  WHERE requester_id = requester_user_id
    AND receiver_id = v_uid
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION '신청을 찾을 수 없습니다.';
  END IF;

  RETURN json_build_object('success', true, 'status', 'accepted');
END;
$function$;

REVOKE ALL ON FUNCTION public.get_friend_recommendations(integer, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_friend_recommendations(integer, double precision) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_friend_recommendations(integer, double precision) TO authenticated;

REVOKE ALL ON FUNCTION public.send_friend_request(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.send_friend_request(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.send_friend_request(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.accept_friend_request(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_friend_request(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_friend_request(uuid) TO authenticated;
