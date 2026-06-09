-- ============================================================
-- User block RPC
-- ============================================================
-- 사용자 차단은 block row 생성과 기존 친구 관계 삭제를 한 번에 처리한다.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'blocks_not_self'
      AND conrelid = 'public.blocks'::regclass
  ) THEN
    ALTER TABLE public.blocks
    ADD CONSTRAINT blocks_not_self CHECK (blocker_id <> blocked_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.block_user(target_user_id uuid)
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

  IF target_user_id IS NULL OR target_user_id = v_uid THEN
    RAISE EXCEPTION '차단할 수 없는 사용자입니다.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = target_user_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION '사용자를 찾을 수 없습니다.';
  END IF;

  INSERT INTO public.blocks (blocker_id, blocked_id)
  VALUES (v_uid, target_user_id)
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;

  DELETE FROM public.user_connections
  WHERE (requester_id = v_uid AND receiver_id = target_user_id)
     OR (requester_id = target_user_id AND receiver_id = v_uid);

  DELETE FROM public.user_favorites
  WHERE (user_id = v_uid AND favorite_user_id = target_user_id)
     OR (user_id = target_user_id AND favorite_user_id = v_uid);

  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_block_related_user_ids()
RETURNS TABLE(user_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT blocked_id AS user_id
  FROM public.blocks
  WHERE blocker_id = auth.uid()
  UNION
  SELECT blocker_id AS user_id
  FROM public.blocks
  WHERE blocked_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.block_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_block_related_user_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.block_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_block_related_user_ids() TO authenticated;
