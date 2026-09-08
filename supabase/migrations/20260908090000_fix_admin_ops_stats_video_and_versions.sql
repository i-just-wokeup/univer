-- 관리자 운영 지표 두 가지를 바로잡는다.
--
-- 1) "영상 처리"가 사진까지 세고 있었다. processing_status 가
--    not null default 'ready' 라(20260701051431) 모든 사진이 ready 로 들어간다.
--    실측: 완료 166건 중 사진이 124건, 영상은 42건뿐이었다.
--    → type = 'video' 로 거르고, 삭제된 게시물의 미디어도 뺀다.
--
-- 2) "앱 버전" 목록이 기록 없는 사용자로 도배됐다. 배포 전 사용자가 대부분이라
--    '알 수 없음' 한 줄이 목록 맨 위를 차지해 실제 버전이 밀려난다.
--    기록 없는 인원은 activity.unknown 으로 이미 보여주므로 목록에서는 뺀다.

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
      -- 최근 24시간 기준(화면 라벨도 "최근 24시간"으로 맞춰져 있다)
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
    -- 기록이 있는 사용자만. 없는 사람 수는 activity.unknown 에서 본다.
    'appVersions', coalesce((
      select json_agg(row_to_json(v) order by v.count desc)
      from (
        select coalesce(app_platform, '알 수 없음') as platform,
               app_version                          as version,
               count(*)                             as count
        from public.users
        where deleted_at is null
          and app_version is not null
        group by 1, 2
      ) v
    ), '[]'::json),
    -- 영상만. 사진은 처리 과정이 없어 항상 ready 로 들어간다.
    'media', (
      select json_build_object(
        'ready',      count(*) filter (where m.processing_status = 'ready'),
        'processing', count(*) filter (where m.processing_status = 'processing'),
        'failed',     count(*) filter (where m.processing_status = 'failed')
      )
      from public.post_media m
      join public.posts p on p.id = m.post_id
      where m.type = 'video'
        and p.deleted_at is null
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
