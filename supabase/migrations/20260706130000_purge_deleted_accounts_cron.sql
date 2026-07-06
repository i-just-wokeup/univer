-- 탈퇴(soft delete) 후 보존기간(기본 30일)이 지난 계정을 영구 삭제한다.
-- - comments: users FK가 SET NULL이라 auth 삭제만으론 안 지워짐 → 명시 삭제(대댓글/좋아요 CASCADE)
-- - auth.users: 삭제 시 public.users FK(CASCADE) → posts/stories/messages/likes/follows 등 연쇄 삭제
-- postgres가 auth.users DELETE 권한 있어 SECURITY DEFINER로 처리. pg_cron이 직접 호출(HTTP/키 불필요).
-- ⚠️ Storage 파일은 여기서 못 지움: storage.objects 직접 DELETE는 protect_delete 트리거가 막고(Storage API 필요),
--    owner 컬럼엔 auth FK도 없어 연쇄도 안 됨. → 스토리지 orphan 정리는 별도 과제(Storage API 도구/주기 스윕).
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
  v_cutoff timestamptz := now() - make_interval(days => p_retention_days);
  v_uid uuid;
  v_purged int := 0;
  v_ids uuid[] := '{}';
BEGIN
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

-- 일반 사용자 호출 차단(내부/cron만).
REVOKE ALL ON FUNCTION public.purge_deleted_accounts(int, boolean) FROM public, anon, authenticated;

-- 매일 자동 실행. pg_cron 활성화 후 스케줄 등록(재적용 대비 unschedule 먼저).
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-deleted-accounts') THEN
    PERFORM cron.unschedule('purge-deleted-accounts');
  END IF;
  -- 매일 04:10 UTC (KST 13:10): 30일 지난 탈퇴 계정 영구 삭제
  PERFORM cron.schedule(
    'purge-deleted-accounts',
    '10 4 * * *',
    $job$SELECT public.purge_deleted_accounts(30, false)$job$
  );
END
$cron$;
