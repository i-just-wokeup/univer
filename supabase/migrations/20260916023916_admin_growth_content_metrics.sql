-- KST calendar days; acquisition/activity use active, non-deleted accounts.
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
    count(*) filter (where joined_on >= v_today - 6) as day7,
    count(*) filter (where joined_on >= v_today - 29) as day30
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
  -- 의도: D1은 가입 당일을 제외하고, D7/D30은 N일차에서 끝나는 3일 창이다.
  select n.day, n.window_start, count(u.id) as eligible,
    count(u.id) filter (where exists (
      select 1 from activity a where a.user_id=u.id and a.day between u.joined_on+n.window_start and u.joined_on+n.day
    )) as retained
  from (values (1,1),(7,5),(30,28)) n(day,window_start)
  left join members u on u.joined_on+n.day < v_today
  group by n.day, n.window_start
), content_posts as materialized (
  -- 의도: 콘텐츠는 미삭제 글 전체를 센다. 활성 회원 모집단 필터를 추가하지 않는다.
  select id, user_id, created_at from public.posts
  where deleted_at is null and created_at <= v_now
), reactions as (
  select p.id as post_id, l.created_at
  from content_posts p join public.post_likes l
    on l.target_type = 'post' and l.target_id = p.id and l.user_id <> p.user_id
  where l.created_at >= p.created_at and l.created_at <= v_now
  union all
  -- comments는 hard delete이며 deleted_at 컬럼이 없다.
  select p.id, c.created_at
  from content_posts p join public.comments c on c.post_id = p.id and c.user_id <> p.user_id
  where c.created_at >= p.created_at and c.created_at <= v_now
), reacted_posts as materialized (
  select p.*, r.first_at
  from content_posts p left join (
    select post_id, min(created_at) as first_at from reactions group by post_id
  ) r on r.post_id = p.id
), recent_content as (
  -- 의도: 오늘 포함 KST 30개 날짜. 방금 쓴 글도 포함하며 24시간 유예는 없다.
  select * from reacted_posts
  where created_at >= ((v_today - 29)::timestamp at time zone 'Asia/Seoul')
), content_summary as (
  select count(*) as posts, count(*) filter (where first_at is null) as silent,
    count(first_at) as measured,
    -- 의도: 늦은 반응 이상치의 영향을 줄이기 위해 평균 대신 중앙값을 쓴다.
    round((percentile_cont(0.5) within group (
      order by extract(epoch from (first_at - created_at)) / 3600
    ))::numeric, 1) as median_hours
  from recent_content
), ordered_posts as (
  select user_id, created_at,
    row_number() over (partition by user_id order by created_at, id) as position
  from content_posts
), author_posts as (
  select user_id, min(created_at) filter (where position = 1) as first_at,
    min(created_at) filter (where position = 2) as second_at
  from ordered_posts where position <= 2 group by user_id
), rewrite as (
  -- 의도: 첫 글 이후 168시간 관찰이 끝난 작성자만 분모에 포함한다.
  select count(*) as eligible,
    count(*) filter (where second_at <= first_at + interval '7 days') as repeated
  from author_posts where first_at + interval '7 days' <= v_now
), weeks as (
  select date_trunc('week', v_today::timestamp)::date - 7 * n as week_start
  from generate_series(7, 0, -1) n
), north_star as (
  -- 의도: 반응 발생 주가 아닌 글 작성 주로 귀속하며, 조회 시점까지의 반응을 센다.
  select w.week_start, count(distinct p.user_id) as authors
  from weeks w left join reacted_posts p
    on p.created_at >= (w.week_start::timestamp at time zone 'Asia/Seoul')
    and p.created_at < ((w.week_start + 7)::timestamp at time zone 'Asia/Seoul')
    and p.first_at is not null
  group by w.week_start
), gaps as (
  select user_id, day, lag(day) over (partition by user_id order by day) as previous_day
  from activity
), power as (
  select user_id, count(*)::integer as days from activity
  where day >= v_today-29 group by user_id
)
select jsonb_build_object(
  'asOf', v_now, 'timezone', 'Asia/Seoul',
  'acquisition', jsonb_build_object('day1', t.today, 'day7', t.day7, 'day30', t.day30, 'total', t.members),
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
      'day', r.day, 'windowStart', r.window_start, 'windowEnd', r.day,
      'churnRate', round(100 - round(100.0*r.retained/nullif(r.eligible,0),1),1), 'eligible', r.eligible, 'retained', r.retained,
      'rate', round(100.0*r.retained/nullif(r.eligible,0),1)
    ) order by r.day) from retention r),
    'resurrected', (select count(distinct user_id) from gaps
      where day >= v_today-6 and day-previous_day >= 15)
  ),
  'content', jsonb_build_object(
    'noReaction', (select jsonb_build_object('posts', posts, 'silent', silent,
      'rate', round(100.0*silent/nullif(posts,0),1)) from content_summary),
    'firstReaction', (select jsonb_build_object('medianHours', median_hours,
      'measured', measured) from content_summary),
    'rewrite', (select jsonb_build_object('eligible', eligible, 'repeated', repeated,
      'rate', round(100.0*repeated/nullif(eligible,0),1)) from rewrite),
    'northStar', (select jsonb_agg(jsonb_build_object('weekStart', week_start,
      'authors', authors) order by week_start) from north_star)
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
