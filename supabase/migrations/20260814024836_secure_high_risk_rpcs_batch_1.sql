-- 높은 위험 RPC 보안 수정 배치 1.
-- 지표 owner는 서버에서 계산하고, 크루 관계는 학교·활성·차단·무방향 중복을 검증한다.

drop function if exists public.record_metric(text, text, uuid);

create function public.record_metric(
  p_metric_type text,
  p_target_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_owner_id uuid;
  v_target_uuid uuid;
  v_canonical_target_id text;
begin
  if v_actor_id is null
    or p_target_id is null
    or p_target_id = ''
    or p_metric_type not in ('reel_view', 'post_view', 'profile_visit', 'link_click') then
    return;
  end if;

  begin
    v_target_uuid := p_target_id::uuid;
  exception
    when invalid_text_representation then
      return;
  end;

  if p_metric_type in ('reel_view', 'post_view') then
    select p.user_id, p.id::text
      into v_owner_id, v_canonical_target_id
    from public.posts p
    where p.id = v_target_uuid
      and p.deleted_at is null;
  elsif p_metric_type = 'profile_visit' then
    select u.id, u.id::text
      into v_owner_id, v_canonical_target_id
    from public.users u
    where u.id = v_target_uuid
      and u.is_active = true
      and u.deleted_at is null;
  else
    -- 링크 클릭은 profile_links.id를 받아 owner를 계산하되, 기존 집계 키는 URL로 유지한다.
    select pl.user_id, pl.url
      into v_owner_id, v_canonical_target_id
    from public.profile_links pl
    join public.users owner on owner.id = pl.user_id
    where pl.id = v_target_uuid
      and owner.is_active = true
      and owner.deleted_at is null;
  end if;

  if v_owner_id is null or v_actor_id = v_owner_id then
    return;
  end if;

  insert into public.metric_events (
    actor_id,
    owner_id,
    metric_type,
    target_id
  )
  values (
    v_actor_id,
    v_owner_id,
    p_metric_type,
    v_canonical_target_id
  )
  on conflict do nothing;
end;
$function$;

revoke all on function public.record_metric(text, text) from public, anon;
grant execute on function public.record_metric(text, text) to authenticated;

drop function if exists public.record_reel_watch(
  uuid, uuid, uuid, integer, integer, boolean, integer
);

create function public.record_reel_watch(
  p_event_id uuid,
  p_post_id uuid,
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
  v_owner_id uuid;
begin
  if v_actor_id is null
    or p_event_id is null
    or p_post_id is null
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
    into v_owner_id
  from public.posts p
  where p.id = p_post_id
    and p.deleted_at is null
    and exists (
      select 1
      from public.post_media pm
      where pm.post_id = p.id
        and pm.type = 'video'
    );

  if v_owner_id is null or v_actor_id = v_owner_id then
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
    v_owner_id,
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
  uuid, uuid, integer, integer, boolean, integer
) from public, anon;
grant execute on function public.record_reel_watch(
  uuid, uuid, integer, integer, boolean, integer
) to authenticated;

create unique index if not exists user_connections_unordered_pair_key
  on public.user_connections (
    least(requester_id, receiver_id),
    greatest(requester_id, receiver_id)
  );

create or replace function public.send_friend_request(target_user_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_viewer_university_id uuid;
  v_target_university_id uuid;
begin
  if v_uid is null then
    raise exception 'Unauthorized';
  end if;

  if target_user_id is null or v_uid = target_user_id then
    raise exception '본인에게 신청할 수 없습니다.';
  end if;

  -- 같은 두 사용자의 동시 신청도 한 방향 상태로 직렬화한다.
  perform u.id
  from public.users u
  where u.id in (v_uid, target_user_id)
  order by u.id
  for update;

  select viewer.university_id, target.university_id
    into v_viewer_university_id, v_target_university_id
  from public.users viewer
  join public.users target on target.id = target_user_id
  where viewer.id = v_uid
    and viewer.is_active = true
    and viewer.deleted_at is null
    and target.is_active = true
    and target.deleted_at is null;

  if not found then
    raise exception '활성 상태인 사용자를 찾을 수 없습니다.';
  end if;

  if v_viewer_university_id is distinct from v_target_university_id then
    raise exception '같은 학교 사용자에게만 크루 신청할 수 있습니다.';
  end if;

  if exists (
    select 1
    from public.blocks b
    where (b.blocker_id = v_uid and b.blocked_id = target_user_id)
       or (b.blocker_id = target_user_id and b.blocked_id = v_uid)
  ) then
    raise exception '차단 관계에서는 크루 신청을 할 수 없습니다.';
  end if;

  if exists (
    select 1
    from public.users participant
    where participant.id in (v_uid, target_user_id)
      and (
        participant.is_promoted = true
        or exists (
          select 1
          from public.official_accounts oa
          where oa.user_id = participant.id
        )
      )
  ) then
    raise exception '기관 또는 승격 계정은 크루 관계를 맺을 수 없습니다.';
  end if;

  if exists (
    select 1
    from public.user_connections uc
    where uc.status = 'accepted'
      and (
        (uc.requester_id = v_uid and uc.receiver_id = target_user_id)
        or (uc.requester_id = target_user_id and uc.receiver_id = v_uid)
      )
  ) then
    raise exception '이미 친구입니다.';
  end if;

  -- 상대가 먼저 신청했다면 두 번째 방향 행을 만들지 않고 즉시 수락한다.
  update public.user_connections
  set status = 'accepted', updated_at = pg_catalog.now()
  where requester_id = target_user_id
    and receiver_id = v_uid
    and status = 'pending';

  if found then
    return json_build_object('success', true, 'status', 'accepted');
  end if;

  -- 과거 거절 행은 방향을 바꾼 새 신청을 막지 않도록 제거한다.
  delete from public.user_connections
  where requester_id = target_user_id
    and receiver_id = v_uid
    and status = 'rejected';

  insert into public.user_connections (requester_id, receiver_id, status)
  values (v_uid, target_user_id, 'pending')
  on conflict (requester_id, receiver_id)
  do update set status = 'pending', updated_at = pg_catalog.now();

  return json_build_object('success', true, 'status', 'pending');
end;
$function$;

create or replace function public.accept_friend_request(requester_user_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_viewer_university_id uuid;
  v_requester_university_id uuid;
begin
  if v_uid is null then
    raise exception 'Unauthorized';
  end if;

  if requester_user_id is null or v_uid = requester_user_id then
    raise exception '신청을 찾을 수 없습니다.';
  end if;

  perform u.id
  from public.users u
  where u.id in (v_uid, requester_user_id)
  order by u.id
  for update;

  select viewer.university_id, requester.university_id
    into v_viewer_university_id, v_requester_university_id
  from public.users viewer
  join public.users requester on requester.id = requester_user_id
  where viewer.id = v_uid
    and viewer.is_active = true
    and viewer.deleted_at is null
    and requester.is_active = true
    and requester.deleted_at is null;

  if not found then
    raise exception '활성 상태인 사용자를 찾을 수 없습니다.';
  end if;

  if v_viewer_university_id is distinct from v_requester_university_id then
    raise exception '같은 학교 사용자와만 크루 관계를 맺을 수 있습니다.';
  end if;

  if exists (
    select 1
    from public.blocks b
    where (b.blocker_id = v_uid and b.blocked_id = requester_user_id)
       or (b.blocker_id = requester_user_id and b.blocked_id = v_uid)
  ) then
    raise exception '차단 관계에서는 크루 신청을 수락할 수 없습니다.';
  end if;

  if exists (
    select 1
    from public.users participant
    where participant.id in (v_uid, requester_user_id)
      and (
        participant.is_promoted = true
        or exists (
          select 1
          from public.official_accounts oa
          where oa.user_id = participant.id
        )
      )
  ) then
    raise exception '기관 또는 승격 계정은 크루 관계를 맺을 수 없습니다.';
  end if;

  update public.user_connections
  set status = 'accepted', updated_at = pg_catalog.now()
  where requester_id = requester_user_id
    and receiver_id = v_uid
    and status = 'pending';

  if not found then
    raise exception '신청을 찾을 수 없습니다.';
  end if;

  return json_build_object('success', true, 'status', 'accepted');
end;
$function$;

revoke all on function public.send_friend_request(uuid) from public, anon;
grant execute on function public.send_friend_request(uuid) to authenticated;

revoke all on function public.accept_friend_request(uuid) from public, anon;
grant execute on function public.accept_friend_request(uuid) to authenticated;

notify pgrst, 'reload schema';
