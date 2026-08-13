-- 콘텐츠 성과 RPC와 동일하게 삭제되지 않은 내 게시물의 반응만 집계한다.

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
      and p.deleted_at is null
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
