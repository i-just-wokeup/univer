-- KST calendar days; active, non-deleted accounts only.
-- Events are surviving records, not an immutable analytics history.
-- Activation stages are independent reach, not ordered conversions.
create or replace function public.get_admin_growth_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_now timestamptz := now();
  v_today date := (v_now at time zone 'Asia/Seoul')::date;
  v_result jsonb;
begin
  -- Same authorization contract as get_admin_ops_stats().
  if not exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Unauthorized';
  end if;

  -- Dn denominators exclude cohort target days that have not ended.
  -- A gap of 15 calendar days means 14 whole inactive days.
  with members as materialized (
  select id, created_at, (created_at at time zone 'Asia/Seoul')::date as joined_on
  from public.users
  where is_active and deleted_at is null and created_at <= v_now
), events as (
  select user_id, seen_at as happened_at from public.post_impressions
  union all select user_id, created_at from public.posts where deleted_at is null
  union all select user_id, created_at from public.comments
  union all select user_id, created_at from public.post_likes
), activity as materialized (
  select distinct e.user_id, (e.happened_at at time zone 'Asia/Seoul')::date as day
  from events e join members u on u.id = e.user_id
  where e.happened_at >= u.created_at and e.happened_at <= v_now
), first_posts as (
  select u.id, min(p.created_at) as first_at, u.created_at
  from members u join public.posts p on p.user_id = u.id
  where p.deleted_at is null and p.created_at >= u.created_at and p.created_at <= v_now
  group by u.id, u.created_at
), crew as (
  select requester_id as user_id from public.user_connections where status = 'accepted'
  union select receiver_id from public.user_connections where status = 'accepted'
), totals as (
  select count(*) as members,
    count(*) filter (where joined_on = v_today) as today,
    count(*) filter (where joined_on >= date_trunc('week', v_today::timestamp)::date) as week
  from members
), active_counts as (
  select count(distinct user_id) filter (where day = v_today) as dau,
    count(*) filter (where day >= v_today - 6)::numeric / 7 as dau_average,
    count(distinct user_id) filter (where day >= v_today - 6) as wau,
    count(distinct user_id) filter (where day >= v_today - 29) as mau
  from activity
), stages as (
  select 1 as position, 'signup' as key, count(*) as people from members
  union all select 2, 'feed', count(*) from members u
    where exists (select 1 from public.post_impressions i where i.user_id=u.id and i.seen_at <= v_now)
  union all select 3, 'post', count(*) from first_posts
  union all select 4, 'like', count(*) from members u
    where exists (select 1 from public.post_likes l where l.user_id=u.id and l.created_at <= v_now)
  union all select 5, 'crew', count(*) from members u
    where exists (select 1 from crew c where c.user_id=u.id)
), retention as (
  select n.day, count(u.id) as eligible,
    count(u.id) filter (where exists (
      select 1 from activity a where a.user_id=u.id and a.day=u.joined_on+n.day
    )) as retained
  from (values (1),(7),(30)) n(day)
  left join members u on u.joined_on+n.day < v_today
  group by n.day
), gaps as (
  select user_id, day, lag(day) over (partition by user_id order by day) as previous_day
  from activity
), power as (
  select user_id, count(*)::integer as days from activity
  where day >= v_today-29 group by user_id
)
select jsonb_build_object(
  'asOf', v_now, 'timezone', 'Asia/Seoul',
  'acquisition', jsonb_build_object('today', t.today, 'week', t.week, 'total', t.members),
  'activation', jsonb_build_object(
    'stages', (select jsonb_agg(jsonb_build_object(
      'key', s.key, 'count', s.people,
      'rate', round(100.0*s.people/nullif(t.members,0),1)
    ) order by s.position) from stages s),
    'averageFirstPostHours', (select round(avg(extract(epoch from (first_at-created_at))/3600),1) from first_posts),
    'firstPostWithin7Days', (select count(*) from first_posts where first_at <= created_at+interval '7 days')
  ),
  'retention', jsonb_build_object(
    'dau', a.dau, 'dau7Average', round(a.dau_average,1), 'wau', a.wau, 'mau', a.mau,
    'stickiness', round(100.0*a.dau/nullif(a.mau,0),1),
    'averageStickiness', round(100.0*a.dau_average/nullif(a.mau,0),1),
    'cohorts', (select jsonb_agg(jsonb_build_object(
      'day', r.day, 'eligible', r.eligible, 'retained', r.retained,
      'rate', round(100.0*r.retained/nullif(r.eligible,0),1)
    ) order by r.day) from retention r),
    'resurrected', (select count(distinct user_id) from gaps
      where day >= v_today-6 and day-previous_day >= 15)
  ),
  'powerUsers', (select jsonb_agg(jsonb_build_object('days', n.day, 'users',
    (select count(*) from power p where p.days=n.day)) order by n.day)
    from generate_series(1,30) n(day))
) into v_result from totals t cross join active_counts a;
  return v_result;
end;
$function$;

revoke all on function public.get_admin_growth_stats() from public, anon;
grant execute on function public.get_admin_growth_stats() to authenticated;
