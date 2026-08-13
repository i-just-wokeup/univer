-- 본인 게시물의 단건 인사이트와 영상 시청 유지율 분포.
-- SECURITY DEFINER 함수가 원시 지표 테이블을 읽되 auth.uid() 소유 글만 반환한다.

create index if not exists reel_watch_events_owner_post_idx
  on public.reel_watch_events (owner_id, post_id);

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
    metrics.reach,
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
    select
      count(*)::integer as views,
      count(distinct me.actor_id)::integer as reach
    from public.metric_events me
    where me.owner_id = auth.uid()
      and me.target_id = p.id::text
      and me.metric_type in ('post_view', 'reel_view')
  ) metrics
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

create or replace function public.get_post_retention(p_post_id uuid)
returns table(
  bucket_pct integer,
  retention numeric
)
language sql
stable
security definer
set search_path = ''
as $function$
  with owned_video as (
    select p.id
    from public.posts p
    where auth.uid() is not null
      and p_post_id is not null
      and p.id = p_post_id
      and p.user_id = auth.uid()
      and p.deleted_at is null
      and exists (
        select 1
        from public.post_media pm
        where pm.post_id = p.id
          and pm.type = 'video'
      )
  ),
  watch as (
    select e.max_pct
    from public.reel_watch_events e
    join owned_video p on p.id = e.post_id
    where e.owner_id = auth.uid()
  )
  select
    bucket.bucket_pct,
    round(
      100.0 * count(*) filter (where watch.max_pct >= bucket.bucket_pct)
      / nullif(count(*), 0),
      2
    ) as retention
  from generate_series(0, 100, 5) as bucket(bucket_pct)
  cross join watch
  group by bucket.bucket_pct
  order by bucket.bucket_pct;
$function$;

revoke all on function public.get_post_retention(uuid) from public, anon;
grant execute on function public.get_post_retention(uuid) to authenticated;
