-- 릴스 시청 세션 원시 이벤트와 크리에이터용 요약 집계.
-- 원시 행은 Data API에서 직접 읽거나 쓸 수 없고, 검증된 RPC로만 기록·조회한다.

create table public.reel_watch_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique,
  actor_id uuid not null references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  video_duration_ms integer not null check (video_duration_ms > 0),
  max_pct smallint not null check (max_pct between 0 and 100),
  completed boolean not null,
  loops smallint not null check (loops >= 0),
  event_date date not null default ((now() at time zone 'Asia/Seoul')::date),
  created_at timestamptz not null default now()
);

create index reel_watch_events_owner_date_idx
  on public.reel_watch_events (owner_id, event_date);

alter table public.reel_watch_events enable row level security;

revoke all on table public.reel_watch_events from public, anon, authenticated;

create or replace function public.record_reel_watch(
  p_event_id uuid,
  p_post_id uuid,
  p_owner_id uuid,
  p_video_duration_ms integer,
  p_max_pct integer,
  p_completed boolean,
  p_loops integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_actual_owner_id uuid;
begin
  if v_actor_id is null
    or p_event_id is null
    or p_post_id is null
    or p_owner_id is null
    or p_video_duration_ms is null
    or p_video_duration_ms <= 0
    or p_max_pct is null
    or p_max_pct < 0
    or p_max_pct > 100
    or p_completed is null
    or p_loops is null
    or p_loops < 0
    or p_loops > 32767 then
    return;
  end if;

  select p.user_id
  into v_actual_owner_id
  from public.posts p
  where p.id = p_post_id
    and p.deleted_at is null
    and exists (
      select 1
      from public.post_media pm
      where pm.post_id = p.id
        and pm.type = 'video'
    );

  -- 전달된 owner를 신뢰하지 않고 실제 게시물 소유자와 일치할 때만 기록한다.
  if v_actual_owner_id is null
    or v_actual_owner_id <> p_owner_id
    or v_actor_id = v_actual_owner_id then
    return;
  end if;

  insert into public.reel_watch_events (
    event_id,
    actor_id,
    owner_id,
    post_id,
    video_duration_ms,
    max_pct,
    completed,
    loops
  )
  values (
    p_event_id,
    v_actor_id,
    v_actual_owner_id,
    p_post_id,
    p_video_duration_ms,
    p_max_pct::smallint,
    p_completed or p_loops > 0 or p_max_pct >= 95,
    p_loops::smallint
  )
  on conflict (event_id) do nothing;
end;
$function$;

revoke all on function public.record_reel_watch(
  uuid, uuid, uuid, integer, integer, boolean, integer
) from public, anon;
grant execute on function public.record_reel_watch(
  uuid, uuid, uuid, integer, integer, boolean, integer
) to authenticated;

create or replace function public.get_video_watch_summary(
  p_start date,
  p_end date
)
returns table(
  sessions integer,
  completion_rate numeric,
  avg_depth numeric,
  avg_loops numeric,
  avg_exit_pct numeric
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    count(*)::integer as sessions,
    coalesce(
      round(100.0 * count(*) filter (where e.completed) / nullif(count(*), 0), 2),
      0
    ) as completion_rate,
    coalesce(round(avg(e.max_pct), 2), 0) as avg_depth,
    coalesce(round(avg(e.loops), 2), 0) as avg_loops,
    coalesce(round(avg(e.max_pct) filter (where not e.completed), 2), 0) as avg_exit_pct
  from public.reel_watch_events e
  join public.posts p on p.id = e.post_id
  where auth.uid() is not null
    and e.owner_id = auth.uid()
    and p.user_id = auth.uid()
    and p.deleted_at is null
    and p_start is not null
    and p_end is not null
    and p_start <= p_end
    and e.event_date between p_start and p_end;
$function$;

revoke all on function public.get_video_watch_summary(date, date) from public, anon;
grant execute on function public.get_video_watch_summary(date, date) to authenticated;
