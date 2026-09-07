-- 1) 사용자가 어떤 앱 버전을 쓰는지, 마지막으로 언제 왔는지 남긴다.
--
-- 지금은 이 정보가 아예 없어서 "테스터가 새 버전으로 올라왔나"를 Play Console을 열어야
-- 알 수 있고 iOS는 그것도 안 된다. OTA로 내보내면 지금 쓰는 사람부터 바로 쌓인다.

alter table public.users
  add column if not exists app_version  text,
  add column if not exists app_platform text,
  add column if not exists last_seen_at timestamptz;

-- 마지막 접속 조회용. 관리자 대시보드가 이 컬럼으로 오늘/7일 접속자를 센다.
create index if not exists users_last_seen_at_idx
  on public.users (last_seen_at desc)
  where deleted_at is null;

-- users는 민감 컬럼을 트리거로 보호하고 있어 직접 UPDATE 하지 않는다.
-- 이 세 칸만 고치는 전용 함수로 본인 행만 갱신한다.
create or replace function public.record_app_session(
  p_app_version text,
  p_app_platform text
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Unauthorized';
  end if;

  if p_app_platform is not null
     and p_app_platform not in ('android', 'ios', 'web') then
    raise exception 'Invalid platform';
  end if;

  update public.users
  set app_version  = coalesce(nullif(trim(p_app_version), ''), app_version),
      app_platform = coalesce(nullif(trim(p_app_platform), ''), app_platform),
      last_seen_at = now()
  where id = v_uid
    and deleted_at is null;
end;
$function$;

revoke all on function public.record_app_session(text, text) from public, anon;
grant execute on function public.record_app_session(text, text) to authenticated;

-- 2) 운영 지표. 대시보드에 없던 것들을 한 번에 돌려준다.
--    - 접속자: 지금까지 Expo/Play Console을 열어야 볼 수 있던 값
--    - 앱 버전 분포: 누가 업데이트했는지
--    - 영상 처리 상태: 인코딩 실패가 방치되던 문제
--    - 승격 신청 대기: 신고와 달리 대시보드에 없어 놓치기 쉬웠다
--    - 탈퇴자 수: 기존 total이 탈퇴자를 빼고 세서 안 보였다
create or replace function public.get_admin_ops_stats()
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_result json;
  v_now timestamptz := now();
begin
  if not exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Unauthorized';
  end if;

  select json_build_object(
    'activity', json_build_object(
      'today',    (select count(*) from public.users
                    where deleted_at is null and last_seen_at >= v_now - interval '1 day'),
      'week',     (select count(*) from public.users
                    where deleted_at is null and last_seen_at >= v_now - interval '7 days'),
      'dormant',  (select count(*) from public.users
                    where deleted_at is null
                      and (last_seen_at is null or last_seen_at < v_now - interval '7 days')),
      'unknown',  (select count(*) from public.users
                    where deleted_at is null and last_seen_at is null)
    ),
    'appVersions', coalesce((
      select json_agg(row_to_json(v) order by v.count desc)
      from (
        select coalesce(app_platform, '알 수 없음') as platform,
               coalesce(app_version, '알 수 없음')  as version,
               count(*)                             as count
        from public.users
        where deleted_at is null
        group by 1, 2
      ) v
    ), '[]'::json),
    'media', json_build_object(
      'ready',      (select count(*) from public.post_media where processing_status = 'ready'),
      'processing', (select count(*) from public.post_media where processing_status = 'processing'),
      'failed',     (select count(*) from public.post_media where processing_status = 'failed')
    ),
    'pendingPromotions', (select count(*) from public.promotion_requests where status = 'pending'),
    'withdrawnUsers',    (select count(*) from public.users where deleted_at is not null)
  )
  into v_result;

  return v_result;
end;
$function$;

revoke all on function public.get_admin_ops_stats() from public, anon;
grant execute on function public.get_admin_ops_stats() to authenticated;
