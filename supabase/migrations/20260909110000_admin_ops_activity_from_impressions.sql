-- 접속 지표를 실제 활동 기록으로 계산한다.
--
-- 문제: last_seen_at 만 보고 세니 "7일 이상 안 옴 19명"으로 나왔다. 실제로는
--       최근 7일에 17명이 피드를 봤고 14명이 글을 썼다. last_seen_at 은 앱이
--       스스로 보고해야 채워지는데, 그 기능이 9/7 OTA로 나가서 아직 2명만 보고했다.
--       "안 온 사람"과 "아직 보고 안 한 사람"이 뒤섞여 있었다.
--
-- 해결: 이미 쌓이는 데이터로 센다.
--       post_impressions(피드를 본 기록) + posts/comments/post_likes(활동)의
--       가장 최근 시각과 last_seen_at 중 큰 값을 그 사람의 마지막 활동으로 본다.
--       앱 업데이트를 기다리지 않아도 오늘부터 제대로 나온다.

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

  with last_activity as (
    select
      u.id,
      greatest(
        u.last_seen_at,
        (select max(i.seen_at) from public.post_impressions i where i.user_id = u.id),
        (select max(p.created_at) from public.posts p where p.user_id = u.id),
        (select max(c.created_at) from public.comments c where c.user_id = u.id),
        (select max(l.created_at) from public.post_likes l where l.user_id = u.id)
      ) as seen_at
    from public.users u
    where u.deleted_at is null
  )
  select json_build_object(
    'activity', json_build_object(
      'today',   (select count(*) from last_activity
                   where seen_at >= v_now - interval '1 day'),
      'week',    (select count(*) from last_activity
                   where seen_at >= v_now - interval '7 days'),
      'dormant', (select count(*) from last_activity
                   where seen_at is not null and seen_at < v_now - interval '7 days'),
      -- 활동 기록이 아예 없는 사람. 가입만 하고 안 쓴 경우다.
      'unknown', (select count(*) from last_activity where seen_at is null)
    ),
    -- 앱 버전은 앱이 보고해야만 알 수 있다(활동 기록으로는 알 수 없다).
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
    'versionUnknown', (select count(*) from public.users
                        where deleted_at is null and app_version is null),
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
