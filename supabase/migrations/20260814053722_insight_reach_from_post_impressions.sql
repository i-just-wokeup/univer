-- 인사이트 도달을 상세 열람 이벤트가 아니라 홈 피드 실제 노출 기록으로 집계한다.
-- 기간 전체 고유 도달은 일별 고유 도달의 합이 아니므로 각 일별 행에 함께 반환한다.

create index if not exists post_impressions_post_seen_user_idx
  on public.post_impressions (post_id, seen_at, user_id);

create or replace function public.get_post_impression_reach(
  p_start date,
  p_end date
)
returns table(
  day date,
  daily_unique integer,
  period_unique integer
)
language sql
stable
security definer
set search_path = ''
as $function$
  with owned_impressions as (
    select
      impression.user_id as viewer_id,
      (impression.seen_at at time zone 'Asia/Seoul')::date as seen_day
    from public.post_impressions impression
    join public.posts post on post.id = impression.post_id
    where auth.uid() is not null
      and p_start is not null
      and p_end is not null
      and p_start <= p_end
      and post.user_id = auth.uid()
      and post.deleted_at is null
      and impression.user_id <> auth.uid()
      and (impression.seen_at at time zone 'Asia/Seoul')::date
        between p_start and p_end
  ),
  period_reach as (
    select count(distinct viewer_id)::integer as period_unique
    from owned_impressions
  )
  select
    impression.seen_day as day,
    count(distinct impression.viewer_id)::integer as daily_unique,
    period_reach.period_unique
  from owned_impressions impression
  cross join period_reach
  group by impression.seen_day, period_reach.period_unique
  order by impression.seen_day;
$function$;

revoke all on function public.get_post_impression_reach(date, date)
  from public, anon;
grant execute on function public.get_post_impression_reach(date, date)
  to authenticated;

create or replace function public.get_post_insight(p_post_id uuid)
returns table(
  post_id uuid,
  created_at timestamptz,
  thumbnail_url text,
  is_video boolean,
  views integer,
  reach integer,
  likes integer,
  comments integer,
  saves integer,
  shares integer,
  video_duration_ms integer,
  completion_rate numeric,
  avg_depth numeric,
  avg_loops numeric
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    p.id as post_id,
    p.created_at,
    media.thumbnail_url,
    media.is_video,
    metrics.views,
    impressions.reach,
    p.likes_count as likes,
    p.comments_count as comments,
    engagement.saves,
    engagement.shares,
    case
      when media.is_video and watch.sessions > 0 then watch.video_duration_ms
      else null
    end as video_duration_ms,
    case
      when media.is_video and watch.sessions > 0 then watch.completion_rate
      else null
    end as completion_rate,
    case
      when media.is_video and watch.sessions > 0 then watch.avg_depth
      else null
    end as avg_depth,
    case
      when media.is_video and watch.sessions > 0 then watch.avg_loops
      else null
    end as avg_loops
  from public.posts p
  cross join lateral (
    select
      (
        select coalesce(pm.thumbnail_url, pm.url)
        from public.post_media pm
        where pm.post_id = p.id
        order by pm.order_index
        limit 1
      ) as thumbnail_url,
      exists (
        select 1
        from public.post_media pm
        where pm.post_id = p.id
          and pm.type = 'video'
      ) as is_video
  ) media
  cross join lateral (
    select count(*)::integer as views
    from public.metric_events me
    where me.owner_id = auth.uid()
      and me.target_id = p.id::text
      and me.metric_type in ('post_view', 'reel_view')
  ) metrics
  cross join lateral (
    select count(distinct impression.user_id)::integer as reach
    from public.post_impressions impression
    where impression.post_id = p.id
      and impression.user_id <> auth.uid()
  ) impressions
  cross join lateral (
    select
      (select count(*) from public.bookmarks b where b.post_id = p.id)::integer as saves,
      (
        (select count(*) from public.messages m
          where m.shared_post_id = p.id and m.deleted_at is null)
        +
        (select count(*) from public.stories s
          where s.shared_post_id = p.id and s.deleted_at is null)
      )::integer as shares
  ) engagement
  cross join lateral (
    select
      count(*)::integer as sessions,
      round(
        percentile_cont(0.5) within group (order by e.video_duration_ms)
      )::integer as video_duration_ms,
      round(
        100.0 * count(*) filter (where e.completed) / nullif(count(*), 0),
        2
      ) as completion_rate,
      round(avg(e.max_pct), 2) as avg_depth,
      round(avg(e.loops), 2) as avg_loops
    from public.reel_watch_events e
    where e.owner_id = auth.uid()
      and e.post_id = p.id
  ) watch
  where auth.uid() is not null
    and p_post_id is not null
    and p.id = p_post_id
    and p.user_id = auth.uid()
    and p.deleted_at is null;
$function$;

revoke all on function public.get_post_insight(uuid) from public, anon;
grant execute on function public.get_post_insight(uuid) to authenticated;
