-- ============================================================
-- Block management RPCs: get_blocked_users, unblock_user
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_blocked_users()
RETURNS TABLE(
  id uuid,
  nickname text,
  avatar_url text,
  department text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.nickname,
    u.avatar_url,
    u.department,
    b.created_at
  FROM public.blocks b
  JOIN public.users u ON u.id = b.blocked_id
  WHERE b.blocker_id = auth.uid()
    AND u.deleted_at IS NULL
  ORDER BY b.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.unblock_user(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM public.blocks
  WHERE blocker_id = v_uid
    AND blocked_id = target_user_id;

  RETURN json_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.get_blocked_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unblock_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_blocked_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.unblock_user(uuid) TO authenticated;
