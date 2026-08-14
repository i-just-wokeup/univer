-- RPC 보안 수정 배치 2.
-- 차단 관계를 서버에서 필터링하고, recount 호출 대상을 검증하며,
-- 누락된 지표/카운터/인증 RPC 정의를 백필하고 정렬 인자를 제한한다.

create or replace function public.search_users(search_query text)
returns json
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_result json;
begin
  if v_uid is null then
    raise exception 'Unauthorized';
  end if;

  select json_agg(row_to_json(result_row))
    into v_result
  from (
    select
      searched_user.id,
      searched_user.nickname,
      searched_user.avatar_url,
      case
        when searched_user.id = v_uid or searched_user.department_public
          then searched_user.department
        else null
      end as department
    from public.users searched_user
    where searched_user.deleted_at is null
      and searched_user.university_id = (
        select viewer.university_id
        from public.users viewer
        where viewer.id = v_uid
      )
      and searched_user.nickname ilike '%' || search_query || '%'
      and not exists (
        select 1
        from public.blocks blocked
        where (blocked.blocker_id = v_uid and blocked.blocked_id = searched_user.id)
           or (blocked.blocker_id = searched_user.id and blocked.blocked_id = v_uid)
      )
    order by
      case when lower(searched_user.nickname) = lower(search_query) then 0 else 1 end,
      searched_user.nickname asc
    limit 20
  ) result_row;

  return coalesce(v_result, '[]'::json);
end;
$function$;

create or replace function public.get_user_real_name(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return null;
  end if;

  if p_user_id <> v_uid and exists (
    select 1
    from public.blocks blocked
    where (blocked.blocker_id = v_uid and blocked.blocked_id = p_user_id)
       or (blocked.blocker_id = p_user_id and blocked.blocked_id = v_uid)
  ) then
    return null;
  end if;

  if p_user_id = v_uid then
    return (
      select target_user.real_name
      from public.users target_user
      where target_user.id = p_user_id
        and target_user.deleted_at is null
    );
  end if;

  if exists (
    select 1
    from public.users target_user
    join public.users viewer on viewer.id = v_uid
    where target_user.id = p_user_id
      and target_user.deleted_at is null
      and viewer.deleted_at is null
      and target_user.real_name_public = true
      and target_user.university_id = viewer.university_id
  ) then
    return (
      select target_user.real_name
      from public.users target_user
      where target_user.id = p_user_id
        and target_user.deleted_at is null
    );
  end if;

  if exists (
    select 1
    from public.user_connections connection
    where connection.status = 'accepted'
      and (
        (connection.requester_id = v_uid and connection.receiver_id = p_user_id)
        or (connection.requester_id = p_user_id and connection.receiver_id = v_uid)
      )
  ) then
    return (
      select target_user.real_name
      from public.users target_user
      where target_user.id = p_user_id
        and target_user.deleted_at is null
    );
  end if;

  return null;
end;
$function$;

create or replace function public.get_connection_status(target_user_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_connection public.user_connections%rowtype;
  v_friends_count bigint;
begin
  if v_uid is null then
    raise exception 'Unauthorized';
  end if;

  -- 차단 관계에서는 연결 상태와 대상의 크루 수를 모두 숨긴다.
  if target_user_id is null or exists (
    select 1
    from public.blocks blocked
    where (blocked.blocker_id = v_uid and blocked.blocked_id = target_user_id)
       or (blocked.blocker_id = target_user_id and blocked.blocked_id = v_uid)
  ) then
    return json_build_object(
      'status', 'none',
      'is_requester', false,
      'friends_count', 0
    );
  end if;

  select connection.*
    into v_connection
  from public.user_connections connection
  where (connection.requester_id = v_uid and connection.receiver_id = target_user_id)
     or (connection.requester_id = target_user_id and connection.receiver_id = v_uid)
  limit 1;

  select count(*)
    into v_friends_count
  from public.user_connections connection
  where connection.status = 'accepted'
    and (
      connection.requester_id = target_user_id
      or connection.receiver_id = target_user_id
    );

  if v_connection.id is null then
    return json_build_object(
      'status', 'none',
      'is_requester', false,
      'friends_count', v_friends_count
    );
  end if;

  return json_build_object(
    'status', v_connection.status,
    'is_requester', v_connection.requester_id = v_uid,
    'friends_count', v_friends_count
  );
end;
$function$;

-- 원격에만 있던 지표 기록 함수의 배치 1 최종 정의를 로컬 이력에도 백필한다.
create or replace function public.record_metric(
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
    select post.user_id, post.id::text
      into v_owner_id, v_canonical_target_id
    from public.posts post
    where post.id = v_target_uuid
      and post.deleted_at is null;
  elsif p_metric_type = 'profile_visit' then
    select target_user.id, target_user.id::text
      into v_owner_id, v_canonical_target_id
    from public.users target_user
    where target_user.id = v_target_uuid
      and target_user.is_active = true
      and target_user.deleted_at is null;
  else
    select profile_link.user_id, profile_link.url
      into v_owner_id, v_canonical_target_id
    from public.profile_links profile_link
    join public.users owner on owner.id = profile_link.user_id
    where profile_link.id = v_target_uuid
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
  ) values (
    v_actor_id,
    v_owner_id,
    p_metric_type,
    v_canonical_target_id
  )
  on conflict do nothing;
end;
$function$;

create or replace function public.get_metric_counts(
  p_metric_type text,
  p_target_id text default null,
  p_start date default null,
  p_end date default null
)
returns table(total bigint, unique_actors bigint)
language sql
security definer
set search_path = ''
as $function$
  select
    count(*)::bigint,
    count(distinct event.actor_id)::bigint
  from public.metric_events event
  where event.owner_id = auth.uid()
    and event.metric_type = p_metric_type
    and (p_target_id is null or event.target_id = p_target_id)
    and (p_start is null or event.event_date >= p_start)
    and (p_end is null or event.event_date <= p_end);
$function$;

create or replace function public.get_metric_daily(
  p_metric_type text,
  p_target_id text default null,
  p_start date default null,
  p_end date default null
)
returns table(day date, total bigint, unique_actors bigint)
language sql
security definer
set search_path = ''
as $function$
  select
    event.event_date,
    count(*)::bigint,
    count(distinct event.actor_id)::bigint
  from public.metric_events event
  where event.owner_id = auth.uid()
    and event.metric_type = p_metric_type
    and (p_target_id is null or event.target_id = p_target_id)
    and (p_start is null or event.event_date >= p_start)
    and (p_end is null or event.event_date <= p_end)
  group by event.event_date
  order by event.event_date;
$function$;

-- 좋아요/댓글 hard delete 뒤 recount하는 기존 흐름을 유지하기 위해, 소유자·현재 상호작용자뿐 아니라
-- 같은 학교/공개범위/크루/비차단 조건상 실제 상호작용 가능한 사용자도 호출할 수 있다.
create or replace function public.recount_post_likes(p_post_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_count integer;
begin
  if v_actor_id is null then
    raise exception 'Unauthorized';
  end if;

  if not exists (
    select 1
    from public.posts post
    join public.users viewer on viewer.id = v_actor_id
    where post.id = p_post_id
      and post.deleted_at is null
      and viewer.is_active = true
      and viewer.deleted_at is null
      and not exists (
        select 1
        from public.blocks blocked
        where (blocked.blocker_id = v_actor_id and blocked.blocked_id = post.user_id)
           or (blocked.blocker_id = post.user_id and blocked.blocked_id = v_actor_id)
      )
      and (
        post.user_id = v_actor_id
        or (
          post.university_id = viewer.university_id
          and (
            post.visibility = 'public'
            or (
              post.visibility = 'close_friends'
              and exists (
                select 1
                from public.user_connections connection
                where connection.status = 'accepted'
                  and (
                    (connection.requester_id = post.user_id and connection.receiver_id = v_actor_id)
                    or (connection.requester_id = v_actor_id and connection.receiver_id = post.user_id)
                  )
              )
            )
          )
        )
        or exists (
          select 1
          from public.post_likes actor_like
          where actor_like.user_id = v_actor_id
            and actor_like.target_type = 'post'
            and actor_like.target_id = p_post_id
        )
      )
  ) then
    raise exception '이 게시물의 좋아요 수를 재계산할 권한이 없습니다.' using errcode = '42501';
  end if;

  update public.posts post
  set likes_count = (
    select count(*)
    from public.post_likes post_like
    where post_like.target_type = 'post'
      and post_like.target_id = p_post_id
  )
  where post.id = p_post_id
  returning post.likes_count into v_count;

  return coalesce(v_count, 0);
end;
$function$;

create or replace function public.recount_post_comments(p_post_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_count integer;
begin
  if v_actor_id is null then
    raise exception 'Unauthorized';
  end if;

  if not exists (
    select 1
    from public.posts post
    join public.users viewer on viewer.id = v_actor_id
    where post.id = p_post_id
      and post.deleted_at is null
      and viewer.is_active = true
      and viewer.deleted_at is null
      and not exists (
        select 1
        from public.blocks blocked
        where (blocked.blocker_id = v_actor_id and blocked.blocked_id = post.user_id)
           or (blocked.blocker_id = post.user_id and blocked.blocked_id = v_actor_id)
      )
      and (
        post.user_id = v_actor_id
        or (
          post.university_id = viewer.university_id
          and (
            post.visibility = 'public'
            or (
              post.visibility = 'close_friends'
              and exists (
                select 1
                from public.user_connections connection
                where connection.status = 'accepted'
                  and (
                    (connection.requester_id = post.user_id and connection.receiver_id = v_actor_id)
                    or (connection.requester_id = v_actor_id and connection.receiver_id = post.user_id)
                  )
              )
            )
          )
        )
        or exists (
          select 1
          from public.comments actor_comment
          where actor_comment.user_id = v_actor_id
            and actor_comment.post_id = p_post_id
        )
      )
  ) then
    raise exception '이 게시물의 댓글 수를 재계산할 권한이 없습니다.' using errcode = '42501';
  end if;

  update public.posts post
  set comments_count = (
    select count(*)
    from public.comments comment
    where comment.post_id = p_post_id
  )
  where post.id = p_post_id
  returning post.comments_count into v_count;

  return coalesce(v_count, 0);
end;
$function$;

create or replace function public.recount_comment_likes(p_comment_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_count integer;
begin
  if v_actor_id is null then
    raise exception 'Unauthorized';
  end if;

  if not exists (
    select 1
    from public.comments comment
    join public.posts post on post.id = comment.post_id
    join public.users viewer on viewer.id = v_actor_id
    where comment.id = p_comment_id
      and post.deleted_at is null
      and viewer.is_active = true
      and viewer.deleted_at is null
      and not exists (
        select 1
        from public.blocks blocked
        where (blocked.blocker_id = v_actor_id and blocked.blocked_id = post.user_id)
           or (blocked.blocker_id = post.user_id and blocked.blocked_id = v_actor_id)
      )
      and (
        comment.user_id = v_actor_id
        or post.user_id = v_actor_id
        or (
          post.university_id = viewer.university_id
          and (
            post.visibility = 'public'
            or (
              post.visibility = 'close_friends'
              and exists (
                select 1
                from public.user_connections connection
                where connection.status = 'accepted'
                  and (
                    (connection.requester_id = post.user_id and connection.receiver_id = v_actor_id)
                    or (connection.requester_id = v_actor_id and connection.receiver_id = post.user_id)
                  )
              )
            )
          )
        )
        or exists (
          select 1
          from public.comment_likes actor_like
          where actor_like.user_id = v_actor_id
            and actor_like.comment_id = p_comment_id
        )
      )
  ) then
    raise exception '이 댓글의 좋아요 수를 재계산할 권한이 없습니다.' using errcode = '42501';
  end if;

  update public.comments comment
  set likes_count = (
    select count(*)
    from public.comment_likes comment_like
    where comment_like.comment_id = p_comment_id
  )
  where comment.id = p_comment_id
  returning comment.likes_count into v_count;

  return coalesce(v_count, 0);
end;
$function$;

create or replace function public.recount_story_views(p_story_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_count integer;
begin
  if v_actor_id is null then
    raise exception 'Unauthorized';
  end if;

  if not exists (
    select 1
    from public.stories story
    where story.id = p_story_id
      and (
        story.user_id = v_actor_id
        or exists (
          select 1
          from public.story_views actor_view
          where actor_view.story_id = p_story_id
            and actor_view.user_id = v_actor_id
        )
      )
  ) then
    raise exception '이 스토리의 조회수를 재계산할 권한이 없습니다.' using errcode = '42501';
  end if;

  update public.stories story
  set views_count = (
    select count(*)
    from public.story_views story_view
    where story_view.story_id = p_story_id
  )
  where story.id = p_story_id
  returning story.views_count into v_count;

  return coalesce(v_count, 0);
end;
$function$;

create or replace function public.get_verified_user_ids()
returns table(user_id uuid)
language sql
security definer
set search_path = ''
as $function$
  select target_user.id as user_id
  from public.users target_user
  where target_user.is_promoted = true
  union
  select official.user_id
  from public.official_accounts official
  where official.verified_at is not null;
$function$;

create or replace function public.get_feed_post_ids(
  p_seed double precision,
  p_limit integer default 20,
  p_after_band integer default null,
  p_after_rank double precision default null,
  p_half_life_days double precision default 5
)
returns table(post_id uuid, band integer, rank double precision)
language sql
stable
set search_path = ''
as $function$
  with params as (
    select
      coalesce(p_seed, 0)::double precision as seed,
      least(greatest(coalesce(p_limit, 20), 1), 100)::integer as result_limit,
      case
        when p_half_life_days > 0 and p_half_life_days <= 365
          then p_half_life_days
        else 5
      end::double precision as half_life_days
  ),
  me as (
    select auth.uid() as uid
  ),
  crew as (
    select case
      when connection.requester_id = (select uid from me) then connection.receiver_id
      else connection.requester_id
    end as crew_id
    from public.user_connections connection
    where connection.status = 'accepted'
      and (
        connection.requester_id = (select uid from me)
        or connection.receiver_id = (select uid from me)
      )
  ),
  blocked as (
    select relation.blocked_id as uid
    from public.blocks relation
    where relation.blocker_id = (select uid from me)
    union
    select relation.blocker_id as uid
    from public.blocks relation
    where relation.blocked_id = (select uid from me)
  ),
  visible as (
    select
      post.id,
      post.user_id,
      post.created_at,
      post.likes_count,
      post.comments_count,
      exists (
        select 1
        from public.post_impressions impression
        where impression.user_id = (select uid from me)
          and impression.post_id = post.id
      ) as seen,
      post.user_id in (select crew_id from crew) as is_crew
    from public.posts post
    where post.deleted_at is null
      and post.user_id not in (select uid from blocked)
      and post.user_id <> (select uid from me)
  ),
  ranked as (
    select
      visible_post.id as post_id,
      case
        when not visible_post.seen and visible_post.is_crew then 0
        when not visible_post.seen then 1
        else 2
      end as band,
      case
        when not visible_post.seen and visible_post.is_crew
          then extract(epoch from visible_post.created_at)
        when not visible_post.seen then
          (1 + visible_post.likes_count + 2 * visible_post.comments_count)::double precision
          * power(
              0.5,
              (extract(epoch from (now() - visible_post.created_at)) / 86400.0)
              / (select half_life_days from params)
            )
        else (
          ('x' || substr(
            md5(visible_post.id::text || (select seed from params)::text),
            1,
            8
          ))::bit(32)::bigint
        )::double precision
      end as rank
    from visible visible_post
  )
  select ranked_post.post_id, ranked_post.band, ranked_post.rank
  from ranked ranked_post
  where p_after_band is null
     or ranked_post.band > p_after_band
     or (ranked_post.band = p_after_band and ranked_post.rank < p_after_rank)
  order by ranked_post.band asc, ranked_post.rank desc
  limit (select result_limit from params);
$function$;

create or replace function public.get_reel_post_ids(
  p_seed double precision,
  p_seen_ids uuid[] default '{}'::uuid[],
  p_limit integer default 20,
  p_after_band integer default null,
  p_after_rank double precision default null
)
returns table(post_id uuid, band integer, rank double precision)
language sql
stable
set search_path = ''
as $function$
  with params as (
    select
      coalesce(p_seed, 0)::double precision as seed,
      least(greatest(coalesce(p_limit, 20), 1), 100)::integer as result_limit
  ),
  me as (
    select auth.uid() as uid
  ),
  blocked as (
    select relation.blocked_id as uid
    from public.blocks relation
    where relation.blocker_id = (select uid from me)
    union
    select relation.blocker_id as uid
    from public.blocks relation
    where relation.blocked_id = (select uid from me)
  ),
  video_posts as (
    select distinct post.id
    from public.posts post
    join public.post_media media
      on media.post_id = post.id
     and media.type = 'video'
    where post.deleted_at is null
      and post.user_id not in (select uid from blocked)
  ),
  ranked as (
    select
      video_post.id as post_id,
      case
        when video_post.id = any(coalesce(p_seen_ids, '{}'::uuid[])) then 1
        else 0
      end as band,
      (
        ('x' || substr(
          md5(video_post.id::text || (select seed from params)::text),
          1,
          8
        ))::bit(32)::bigint
      )::double precision as rank
    from video_posts video_post
  )
  select ranked_post.post_id, ranked_post.band, ranked_post.rank
  from ranked ranked_post
  where p_after_band is null
     or ranked_post.band > p_after_band
     or (ranked_post.band = p_after_band and ranked_post.rank < p_after_rank)
  order by ranked_post.band asc, ranked_post.rank desc
  limit (select result_limit from params);
$function$;

create or replace function public.get_popular_post_ids(
  p_limit integer default 30,
  p_offset integer default 0,
  p_half_life_hours double precision default 120
)
returns table(post_id uuid, score double precision)
language sql
stable
set search_path = ''
as $function$
  with params as (
    select
      least(greatest(coalesce(p_limit, 30), 1), 100)::integer as result_limit,
      least(greatest(coalesce(p_offset, 0), 0), 10000)::integer as result_offset,
      case
        when p_half_life_hours > 0 and p_half_life_hours <= 8760
          then p_half_life_hours
        else 120
      end::double precision as half_life_hours
  ),
  me as (
    select auth.uid() as uid
  ),
  blocked as (
    select relation.blocked_id as uid
    from public.blocks relation
    where relation.blocker_id = (select uid from me)
    union
    select relation.blocker_id as uid
    from public.blocks relation
    where relation.blocked_id = (select uid from me)
  ),
  scored as (
    select
      post.id as post_id,
      post.created_at,
      (
        (post.likes_count + 2 * post.comments_count)
        * power(
            0.5,
            (extract(epoch from (now() - post.created_at)) / 3600.0)
            / (select half_life_hours from params)
          )
      )::double precision as score
    from public.posts post
    where post.deleted_at is null
      and post.visibility = 'public'
      and post.user_id <> (select uid from me)
      and post.user_id not in (select uid from blocked)
      and exists (
        select 1
        from public.post_media media
        where media.post_id = post.id
      )
  )
  select scored_post.post_id, scored_post.score
  from scored scored_post
  order by scored_post.score desc, scored_post.created_at desc
  limit (select result_limit from params)
  offset (select result_offset from params);
$function$;

revoke all on function public.search_users(text) from public, anon;
grant execute on function public.search_users(text) to authenticated;

revoke all on function public.get_user_real_name(uuid) from public, anon;
grant execute on function public.get_user_real_name(uuid) to authenticated;

revoke all on function public.get_connection_status(uuid) from public, anon;
grant execute on function public.get_connection_status(uuid) to authenticated;

revoke all on function public.record_metric(text, text) from public, anon;
grant execute on function public.record_metric(text, text) to authenticated;

revoke all on function public.get_metric_counts(text, text, date, date) from public, anon;
grant execute on function public.get_metric_counts(text, text, date, date) to authenticated;

revoke all on function public.get_metric_daily(text, text, date, date) from public, anon;
grant execute on function public.get_metric_daily(text, text, date, date) to authenticated;

revoke all on function public.recount_post_likes(uuid) from public, anon;
grant execute on function public.recount_post_likes(uuid) to authenticated;

revoke all on function public.recount_post_comments(uuid) from public, anon;
grant execute on function public.recount_post_comments(uuid) to authenticated;

revoke all on function public.recount_comment_likes(uuid) from public, anon;
grant execute on function public.recount_comment_likes(uuid) to authenticated;

revoke all on function public.recount_story_views(uuid) from public, anon;
grant execute on function public.recount_story_views(uuid) to authenticated;

-- 공개 웹 경로에서 호출하는 코드가 없어 배지 목록 RPC도 인증 사용자 전용으로 축소한다.
revoke all on function public.get_verified_user_ids() from public, anon;
grant execute on function public.get_verified_user_ids() to authenticated;

revoke all on function public.get_account_badges() from public, anon;
grant execute on function public.get_account_badges() to authenticated;

-- 정렬 함수는 RLS를 적용하는 SECURITY INVOKER를 유지한다.
grant execute on function public.get_feed_post_ids(
  double precision, integer, integer, double precision, double precision
) to authenticated, anon;
grant execute on function public.get_reel_post_ids(
  double precision, uuid[], integer, integer, double precision
) to authenticated, anon;
grant execute on function public.get_popular_post_ids(
  integer, integer, double precision
) to authenticated, anon;

notify pgrst, 'reload schema';
