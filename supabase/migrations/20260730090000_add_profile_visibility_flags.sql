-- 프로필 실명/학과 공개 여부(Phase 1).
-- - real_name_public=false: 기존 기본값 유지(본인/크루만 실명 조회)
-- - department_public=true: 기존 기본값 유지(학과 전체 표시)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS real_name_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS department_public boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.get_user_real_name(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return null;
  end if;

  -- 본인은 항상 자기 실명 조회 가능.
  if p_user_id = v_uid then
    return (
      select real_name
      from public.users
      where id = p_user_id and deleted_at is null
    );
  end if;

  -- 실명 공개 ON이면 같은 학교 유저에게 공개.
  if exists (
    select 1
    from public.users target_user
    join public.users viewer on viewer.id = v_uid
    where target_user.id = p_user_id
      and target_user.deleted_at is null
      and viewer.deleted_at is null
      and target_user.real_name_public = true
      and target_user.university_id = viewer.university_id
  ) then
    return (
      select real_name
      from public.users
      where id = p_user_id and deleted_at is null
    );
  end if;

  -- 크루(accepted) 관계면 실명 공개.
  if exists (
    select 1
    from public.user_connections
    where status = 'accepted'
      and (
        (requester_id = v_uid and receiver_id = p_user_id)
        or (requester_id = p_user_id and receiver_id = v_uid)
      )
  ) then
    return (
      select real_name
      from public.users
      where id = p_user_id and deleted_at is null
    );
  end if;

  return null;
end;
$function$;

CREATE OR REPLACE FUNCTION public.search_users(search_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result json;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(row_to_json(r))
  INTO v_result
  FROM (
    SELECT
      u.id,
      u.nickname,
      u.avatar_url,
      CASE
        WHEN u.id = auth.uid() OR u.department_public THEN u.department
        ELSE NULL
      END AS department
    FROM public.users u
    WHERE
      u.deleted_at IS NULL
      AND u.university_id = (
        SELECT viewer.university_id
        FROM public.users viewer
        WHERE viewer.id = auth.uid()
      )
      AND u.nickname ILIKE '%' || search_query || '%'
    ORDER BY
      CASE WHEN LOWER(u.nickname) = LOWER(search_query) THEN 0 ELSE 1 END,
      u.nickname ASC
    LIMIT 20
  ) r;

  RETURN COALESCE(v_result, '[]'::json);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_blocked_users()
RETURNS TABLE(
  id uuid,
  nickname text,
  avatar_url text,
  department text,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    u.id,
    u.nickname,
    u.avatar_url,
    CASE
      WHEN u.id = auth.uid() OR u.department_public THEN u.department
      ELSE NULL
    END AS department,
    b.created_at
  FROM public.blocks b
  JOIN public.users u ON u.id = b.blocked_id
  WHERE b.blocker_id = auth.uid()
    AND u.deleted_at IS NULL
  ORDER BY b.created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.get_friends()
RETURNS TABLE(id uuid, nickname text, avatar_url text, department text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    friend_user.id,
    friend_user.nickname,
    friend_user.avatar_url,
    CASE
      WHEN friend_user.id = auth.uid() OR friend_user.department_public
        THEN friend_user.department
      ELSE NULL
    END AS department
  FROM public.user_connections
  JOIN public.users AS friend_user
    ON friend_user.id = CASE
      WHEN user_connections.requester_id = auth.uid()
        THEN user_connections.receiver_id
      ELSE user_connections.requester_id
    END
  WHERE user_connections.status = 'accepted'
    AND (
      user_connections.requester_id = auth.uid()
      OR user_connections.receiver_id = auth.uid()
    )
  ORDER BY user_connections.created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.get_pending_requests()
RETURNS TABLE(
  id uuid,
  nickname text,
  avatar_url text,
  department text,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    requester.id,
    requester.nickname,
    requester.avatar_url,
    CASE
      WHEN requester.id = auth.uid() OR requester.department_public
        THEN requester.department
      ELSE NULL
    END AS department,
    user_connections.created_at
  FROM public.user_connections
  JOIN public.users AS requester
    ON requester.id = user_connections.requester_id
  WHERE user_connections.receiver_id = auth.uid()
    AND user_connections.status = 'pending'
  ORDER BY user_connections.created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.get_sent_requests()
RETURNS TABLE(
  id uuid,
  nickname text,
  avatar_url text,
  department text,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    receiver.id,
    receiver.nickname,
    receiver.avatar_url,
    CASE
      WHEN receiver.id = auth.uid() OR receiver.department_public
        THEN receiver.department
      ELSE NULL
    END AS department,
    user_connections.created_at
  FROM public.user_connections
  JOIN public.users AS receiver
    ON receiver.id = user_connections.receiver_id
  WHERE user_connections.requester_id = auth.uid()
    AND user_connections.status = 'pending'
  ORDER BY user_connections.created_at DESC;
$function$;
