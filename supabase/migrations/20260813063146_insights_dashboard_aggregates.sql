-- 인사이트 대시보드 v1 집계.
-- 반응은 내 게시물에 발생한 좋아요·댓글·저장·공유를 KST 일자별로 합산한다.
-- 유형별 조회는 기존 metric_events와 story_views만 사용한다.

create or replace function public.get_engagement_daily(
  p_start date,
  p_end date
)
returns table(day date, total integer)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with owned_posts as (
    select p.id
    from public.posts p
    where p.user_id = auth.uid()
  ), engagement_events as (
    select (pl.created_at at time zone 'Asia/Seoul')::date as day
    from public.post_likes pl
    join owned_posts op on op.id = pl.target_id
    where pl.target_type = 'post'

    union all

    select (c.created_at at time zone 'Asia/Seoul')::date as day
    from public.comments c
    join owned_posts op on op.id = c.post_id

    union all

    select (b.created_at at time zone 'Asia/Seoul')::date as day
    from public.bookmarks b
    join owned_posts op on op.id = b.post_id

    union all

    select (m.created_at at time zone 'Asia/Seoul')::date as day
    from public.messages m
    join owned_posts op on op.id = m.shared_post_id
    where m.deleted_at is null

    union all

    select (s.created_at at time zone 'Asia/Seoul')::date as day
    from public.stories s
    join owned_posts op on op.id = s.shared_post_id
    where s.deleted_at is null
  )
  select e.day, count(*)::integer as total
  from engagement_events e
  where p_start is not null
    and p_end is not null
    and p_start <= p_end
    and e.day between p_start and p_end
  group by e.day
  order by e.day;
$function$;

revoke all on function public.get_engagement_daily(date, date) from public, anon;
grant execute on function public.get_engagement_daily(date, date) to authenticated;

create or replace function public.get_views_by_type(
  p_start date,
  p_end date
)
returns table(reel integer, post integer, story integer)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    count(*) filter (where me.metric_type = 'reel_view')::integer as reel,
    count(*) filter (where me.metric_type = 'post_view')::integer as post,
    (
      select count(*)::integer
      from public.story_views sv
      join public.stories s on s.id = sv.story_id
      where s.user_id = auth.uid()
        and (sv.created_at at time zone 'Asia/Seoul')::date between p_start and p_end
    ) as story
  from public.metric_events me
  where me.owner_id = auth.uid()
    and me.metric_type in ('reel_view', 'post_view')
    and p_start is not null
    and p_end is not null
    and p_start <= p_end
    and me.event_date between p_start and p_end;
$function$;

revoke all on function public.get_views_by_type(date, date) from public, anon;
grant execute on function public.get_views_by_type(date, date) to authenticated;
