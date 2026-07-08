-- 탈퇴 계정 영구삭제 보존기간 하한을 DB 함수 자체에서도 강제한다.
-- Edge Function 입력 검증을 우회해 직접 RPC를 호출해도 30일 미만 삭제는 거부된다.
CREATE OR REPLACE FUNCTION public.purge_deleted_accounts(
  p_retention_days int DEFAULT 30,
  p_dry_run boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff timestamptz;
  v_uid uuid;
  v_purged int := 0;
  v_ids uuid[] := '{}';
BEGIN
  IF p_retention_days < 30 THEN
    RAISE EXCEPTION 'retention_days must be at least 30';
  END IF;

  v_cutoff := now() - make_interval(days => p_retention_days);

  FOR v_uid IN
    SELECT id FROM public.users
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff
  LOOP
    v_ids := array_append(v_ids, v_uid);
    IF NOT p_dry_run THEN
      DELETE FROM public.comments WHERE user_id = v_uid;
      DELETE FROM auth.users WHERE id = v_uid; -- CASCADE → public.users → 나머지
    END IF;
    v_purged := v_purged + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'dry_run', p_dry_run,
    'retention_days', p_retention_days,
    'cutoff', v_cutoff,
    'purged', v_purged,
    'ids', to_jsonb(v_ids)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.purge_deleted_accounts(int, boolean) FROM public, anon, authenticated;
