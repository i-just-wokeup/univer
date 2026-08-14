-- 개인 크리에이터 승격 신청과 관리자 심사 RPC.
-- 신청/심사는 SECURITY DEFINER RPC만 허용하고 원본 신청 행은 본인 SELECT만 허용한다.

create table public.promotion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id) on delete set null
);

create index promotion_requests_status_idx
  on public.promotion_requests (status);
create index promotion_requests_user_id_idx
  on public.promotion_requests (user_id);
create unique index promotion_requests_one_pending_per_user_idx
  on public.promotion_requests (user_id)
  where status = 'pending';

alter table public.promotion_requests enable row level security;

create policy promotion_requests_select_own
  on public.promotion_requests
  for select
  to authenticated
  using (user_id = auth.uid());

revoke all on table public.promotion_requests
  from public, anon, authenticated;
grant select on table public.promotion_requests to authenticated;

create function public.request_promotion()
returns json
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_request_id uuid;
  v_posts_count integer;
  v_posts_30d integer;
  v_last_rejected_at timestamptz;
begin
  if v_actor_id is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.users applicant
    where applicant.id = v_actor_id
      and applicant.is_active = true
      and applicant.deleted_at is null
  ) then
    raise exception '활성 계정만 승격을 신청할 수 있습니다.' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.users applicant
    where applicant.id = v_actor_id
      and applicant.is_promoted = true
  ) or exists (
    select 1
    from public.official_accounts official
    where official.user_id = v_actor_id
  ) then
    raise exception '이미 크리에이터입니다.';
  end if;

  select
    count(*)::integer,
    count(*) filter (
      where post.created_at >= now() - interval '30 days'
    )::integer
  into v_posts_count, v_posts_30d
  from public.posts post
  where post.user_id = v_actor_id
    and post.deleted_at is null;

  if v_posts_count < 10 or v_posts_30d < 3 then
    raise exception '게시물 10개 이상, 최근 30일 게시물 3개 이상이 필요합니다.';
  end if;

  if exists (
    select 1
    from public.promotion_requests request
    where request.user_id = v_actor_id
      and request.status = 'pending'
  ) then
    raise exception '이미 심사 중인 신청이 있습니다.';
  end if;

  select max(request.reviewed_at)
  into v_last_rejected_at
  from public.promotion_requests request
  where request.user_id = v_actor_id
    and request.status = 'rejected';

  if v_last_rejected_at is not null
    and v_last_rejected_at > now() - interval '7 days' then
    raise exception '거절 후 7일이 지나야 다시 신청할 수 있습니다.';
  end if;

  insert into public.promotion_requests (user_id)
  values (v_actor_id)
  returning id into v_request_id;

  return json_build_object(
    'id', v_request_id,
    'status', 'pending'
  );
exception
  when unique_violation then
    raise exception '이미 심사 중인 신청이 있습니다.';
end;
$function$;

create function public.get_promotion_requests_for_admin()
returns table (
  request_id uuid,
  user_id uuid,
  nickname text,
  department text,
  created_at timestamptz,
  user_created_at timestamptz,
  posts_count integer,
  posts_30d integer,
  views bigint,
  reach bigint,
  engagement bigint,
  engagement_rate numeric,
  video_count integer,
  avg_completion numeric
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null or not exists (
    select 1
    from public.users admin_user
    where admin_user.id = v_actor_id
      and admin_user.role = 'admin'
      and admin_user.is_active = true
      and admin_user.deleted_at is null
  ) then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  return query
  select
    request.id as request_id,
    applicant.id as user_id,
    applicant.nickname,
    applicant.department,
    request.created_at,
    applicant.created_at as user_created_at,
    post_stats.posts_count,
    post_stats.posts_30d,
    view_stats.views,
    reach_stats.reach,
    engagement_stats.engagement,
    case
      when view_stats.views > 0 then
        round(100.0 * engagement_stats.engagement / view_stats.views, 2)
      else 0::numeric
    end as engagement_rate,
    post_stats.video_count,
    watch_stats.avg_completion
  from public.promotion_requests request
  join public.users applicant on applicant.id = request.user_id
  cross join lateral (
    select
      count(*)::integer as posts_count,
      count(*) filter (
        where post.created_at >= now() - interval '30 days'
      )::integer as posts_30d,
      count(*) filter (
        where exists (
          select 1
          from public.post_media media
          where media.post_id = post.id
            and media.type = 'video'
        )
      )::integer as video_count
    from public.posts post
    where post.user_id = applicant.id
      and post.deleted_at is null
  ) post_stats
  cross join lateral (
    select count(*)::bigint as views
    from public.metric_events metric
    where metric.owner_id = applicant.id
      and metric.metric_type in ('post_view', 'reel_view')
  ) view_stats
  cross join lateral (
    select count(distinct impression.user_id)::bigint as reach
    from public.post_impressions impression
    join public.posts post on post.id = impression.post_id
    where post.user_id = applicant.id
      and post.deleted_at is null
      and impression.user_id <> applicant.id
  ) reach_stats
  cross join lateral (
    select (
      coalesce(sum(post.likes_count + post.comments_count), 0)::bigint
      + (
        select count(*)
        from public.bookmarks bookmark
        join public.posts saved_post on saved_post.id = bookmark.post_id
        where saved_post.user_id = applicant.id
          and saved_post.deleted_at is null
      )
      + (
        select count(*)
        from public.messages message
        join public.posts shared_post on shared_post.id = message.shared_post_id
        where shared_post.user_id = applicant.id
          and shared_post.deleted_at is null
          and message.deleted_at is null
      )
      + (
        select count(*)
        from public.stories story
        join public.posts shared_post on shared_post.id = story.shared_post_id
        where shared_post.user_id = applicant.id
          and shared_post.deleted_at is null
          and story.deleted_at is null
      )
    )::bigint as engagement
    from public.posts post
    where post.user_id = applicant.id
      and post.deleted_at is null
  ) engagement_stats
  cross join lateral (
    select coalesce(
      round(
        100.0 * count(*) filter (where watch.completed)
        / nullif(count(*), 0),
        2
      ),
      0
    ) as avg_completion
    from public.reel_watch_events watch
    join public.posts video_post on video_post.id = watch.post_id
    where watch.owner_id = applicant.id
      and video_post.user_id = applicant.id
      and video_post.deleted_at is null
  ) watch_stats
  where request.status = 'pending'
  order by request.created_at;
end;
$function$;

-- 일반 사용자의 자가 승격은 계속 막고, 실제 관리자 호출자만 is_promoted 변경을 허용한다.
create or replace function public.prevent_sensitive_user_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception '권한(role)은 변경할 수 없습니다.';
  end if;
  if new.university_id is distinct from old.university_id then
    raise exception '학교(university_id)는 변경할 수 없습니다.';
  end if;
  if new.is_active is distinct from old.is_active then
    raise exception '계정 활성 상태(is_active)는 변경할 수 없습니다.';
  end if;
  if new.is_onboarded is distinct from old.is_onboarded then
    if not (old.is_onboarded = false and new.is_onboarded = true) then
      raise exception '온보딩 상태(is_onboarded)는 되돌릴 수 없습니다.';
    end if;
  end if;
  if new.email is distinct from old.email then
    raise exception '이메일(email)은 변경할 수 없습니다.';
  end if;
  if new.real_name is distinct from old.real_name then
    if not (old.real_name is null and new.real_name is not null) then
      raise exception '실명(real_name)은 변경할 수 없습니다.';
    end if;
  end if;
  if new.is_promoted is distinct from old.is_promoted
    and not exists (
      select 1
      from public.users admin_user
      where admin_user.id = auth.uid()
        and admin_user.role = 'admin'
        and admin_user.is_active = true
        and admin_user.deleted_at is null
    ) then
    raise exception '승격 상태(is_promoted)는 관리자만 변경할 수 있습니다.';
  end if;
  if new.credit_balance is distinct from old.credit_balance then
    raise exception '크레딧(credit_balance)은 변경할 수 없습니다.';
  end if;
  if new.level is distinct from old.level then
    raise exception '레벨(level)은 변경할 수 없습니다.';
  end if;
  if new.level_score is distinct from old.level_score then
    raise exception '레벨 점수(level_score)는 변경할 수 없습니다.';
  end if;
  if new.created_at is distinct from old.created_at then
    raise exception '가입일(created_at)은 변경할 수 없습니다.';
  end if;

  return new;
end;
$function$;

create function public.approve_promotion(p_request_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_request public.promotion_requests%rowtype;
begin
  if v_actor_id is null or not exists (
    select 1
    from public.users admin_user
    where admin_user.id = v_actor_id
      and admin_user.role = 'admin'
      and admin_user.is_active = true
      and admin_user.deleted_at is null
  ) then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  select request.*
  into v_request
  from public.promotion_requests request
  where request.id = p_request_id
    and request.status = 'pending'
  for update;

  if not found then
    raise exception '대기 중인 승격 신청을 찾을 수 없습니다.';
  end if;

  update public.users applicant
  set is_promoted = true
  where applicant.id = v_request.user_id
    and applicant.is_active = true
    and applicant.deleted_at is null;

  if not found then
    raise exception '승격할 활성 사용자를 찾을 수 없습니다.';
  end if;

  update public.promotion_requests request
  set
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = v_actor_id
  where request.id = v_request.id;

  insert into public.notifications (user_id, type, message)
  values (
    v_request.user_id,
    'promotion_approved',
    '크리에이터로 승격됐어요! 인사이트·스토리·배지가 열렸습니다.'
  );

  return json_build_object(
    'id', v_request.id,
    'status', 'approved',
    'user_id', v_request.user_id
  );
end;
$function$;

create function public.reject_promotion(p_request_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_request public.promotion_requests%rowtype;
begin
  if v_actor_id is null or not exists (
    select 1
    from public.users admin_user
    where admin_user.id = v_actor_id
      and admin_user.role = 'admin'
      and admin_user.is_active = true
      and admin_user.deleted_at is null
  ) then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  select request.*
  into v_request
  from public.promotion_requests request
  where request.id = p_request_id
    and request.status = 'pending'
  for update;

  if not found then
    raise exception '대기 중인 승격 신청을 찾을 수 없습니다.';
  end if;

  update public.promotion_requests request
  set
    status = 'rejected',
    reviewed_at = now(),
    reviewed_by = v_actor_id
  where request.id = v_request.id;

  insert into public.notifications (user_id, type, message)
  values (
    v_request.user_id,
    'promotion_rejected',
    '이번엔 아쉽게 승인되지 않았어요. 활동을 쌓고 7일 뒤 다시 신청할 수 있습니다.'
  );

  return json_build_object(
    'id', v_request.id,
    'status', 'rejected',
    'user_id', v_request.user_id
  );
end;
$function$;

alter table public.notifications
  drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type = any (array[
    'post_like',
    'story_like',
    'comment_like',
    'post_comment',
    'comment_reply',
    'user_like',
    'friend_request',
    'friend_accepted',
    'report_received',
    'promotion_approved',
    'promotion_rejected'
  ]));

-- 승인·거절 인앱 알림도 기존 알림 INSERT 트리거에서 푸시한다.
create or replace function public.push_on_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_token text;
  v_body text;
  v_data jsonb;
begin
  if new.type = 'post_comment' then
    v_body := '회원님의 게시물에 새 댓글이 달렸어요';
    v_data := jsonb_build_object(
      'targetType', 'post',
      'targetId', new.reference_id
    );
  elsif new.type = 'comment_reply' then
    v_body := '회원님의 댓글에 답글이 달렸어요';
    v_data := jsonb_build_object(
      'targetType', 'post',
      'targetId', new.reference_id
    );
  elsif new.type = 'promotion_approved' then
    v_body := coalesce(
      new.message,
      '크리에이터로 승격됐어요! 인사이트·스토리·배지가 열렸습니다.'
    );
    v_data := jsonb_build_object('targetType', 'insights');
  elsif new.type = 'promotion_rejected' then
    v_body := coalesce(
      new.message,
      '이번엔 아쉽게 승인되지 않았어요. 7일 뒤 다시 신청할 수 있습니다.'
    );
    v_data := jsonb_build_object('targetType', 'promotion');
  else
    return new;
  end if;

  select target_user.fcm_token
  into v_token
  from public.users target_user
  where target_user.id = new.user_id;

  if v_token is null or v_token not like 'ExponentPushToken[%' then
    return new;
  end if;

  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'to', v_token,
      'title', 'unip',
      'body', v_body,
      'priority', 'high',
      'channelId', 'alerts',
      'data', v_data
    )
  );

  return new;
end;
$function$;

revoke all on function public.request_promotion()
  from public, anon;
grant execute on function public.request_promotion()
  to authenticated;

revoke all on function public.get_promotion_requests_for_admin()
  from public, anon;
grant execute on function public.get_promotion_requests_for_admin()
  to authenticated;

revoke all on function public.approve_promotion(uuid)
  from public, anon;
grant execute on function public.approve_promotion(uuid)
  to authenticated;

revoke all on function public.reject_promotion(uuid)
  from public, anon;
grant execute on function public.reject_promotion(uuid)
  to authenticated;

revoke all on function public.push_on_notification()
  from public, anon, authenticated;
