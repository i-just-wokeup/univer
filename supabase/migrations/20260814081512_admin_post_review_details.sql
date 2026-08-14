-- 승격 심사에서 관리자가 신청자의 게시물 지표와 댓글을 검토한다.
-- SECURITY DEFINER로 RLS를 우회하므로 두 함수 모두 내부에서 활성 관리자 여부를 검증한다.

create or replace function public.get_post_insight_for_admin(p_post_id uuid)
returns table (
  post_id uuid,
  created_at timestamptz,
  is_video boolean,
  views integer,
  reach integer,
  likes integer,
  comments integer,
  saves integer,
  shares integer,
  video_duration_ms integer,
  completion_rate numeric,
  avg_depth numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.users admin_user
    where admin_user.id = auth.uid()
      and admin_user.role = 'admin'
      and admin_user.is_active = true
      and admin_user.deleted_at is null
  ) then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  return query
  select
    post.id as post_id,
    post.created_at,
    media.is_video,
    metric.views,
    impression.reach,
    post.likes_count as likes,
    post.comments_count as comments,
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
    end as avg_depth
  from public.posts post
  cross join lateral (
    select exists (
      select 1
      from public.post_media post_media
      where post_media.post_id = post.id
        and post_media.type = 'video'
    ) as is_video
  ) media
  cross join lateral (
    select count(*)::integer as views
    from public.metric_events metric_event
    where metric_event.owner_id = post.user_id
      and metric_event.target_id = post.id::text
      and metric_event.metric_type in ('post_view', 'reel_view')
  ) metric
  cross join lateral (
    select count(distinct post_impression.user_id)::integer as reach
    from public.post_impressions post_impression
    where post_impression.post_id = post.id
      and post_impression.user_id <> post.user_id
  ) impression
  cross join lateral (
    select
      (
        select count(*)::integer
        from public.bookmarks bookmark
        where bookmark.post_id = post.id
      ) as saves,
      (
        (
          select count(*)
          from public.messages message
          where message.shared_post_id = post.id
            and message.deleted_at is null
        )
        +
        (
          select count(*)
          from public.stories story
          where story.shared_post_id = post.id
            and story.deleted_at is null
        )
      )::integer as shares
  ) engagement
  cross join lateral (
    select
      count(*)::integer as sessions,
      round(
        percentile_cont(0.5) within group (order by watch_event.video_duration_ms)
      )::integer as video_duration_ms,
      round(
        100.0 * count(*) filter (where watch_event.completed)
        / nullif(count(*), 0),
        2
      ) as completion_rate,
      round(avg(watch_event.max_pct), 2) as avg_depth
    from public.reel_watch_events watch_event
    where watch_event.owner_id = post.user_id
      and watch_event.post_id = post.id
  ) watch
  where p_post_id is not null
    and post.id = p_post_id
    and post.deleted_at is null;

  if not found then
    raise exception '게시물을 찾을 수 없습니다.';
  end if;
end;
$function$;

create or replace function public.get_post_comments_for_admin(p_post_id uuid)
returns table (
  comment_id uuid,
  user_id uuid,
  parent_id uuid,
  nickname text,
  avatar_url text,
  content text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.users admin_user
    where admin_user.id = auth.uid()
      and admin_user.role = 'admin'
      and admin_user.is_active = true
      and admin_user.deleted_at is null
  ) then
    raise exception '관리자 권한이 필요합니다.' using errcode = '42501';
  end if;

  if p_post_id is null or not exists (
    select 1
    from public.posts post
    where post.id = p_post_id
      and post.deleted_at is null
  ) then
    raise exception '게시물을 찾을 수 없습니다.';
  end if;

  return query
  select
    comment.id as comment_id,
    comment.user_id,
    comment.parent_id,
    coalesce(comment_user.nickname, '탈퇴한 사용자') as nickname,
    comment_user.avatar_url,
    comment.content,
    comment.created_at
  from public.comments comment
  left join public.users comment_user on comment_user.id = comment.user_id
  where comment.post_id = p_post_id
    and comment.deleted_at is null
  order by comment.created_at;
end;
$function$;

revoke all on function public.get_post_insight_for_admin(uuid)
  from public, anon, authenticated;
grant execute on function public.get_post_insight_for_admin(uuid)
  to authenticated;

revoke all on function public.get_post_comments_for_admin(uuid)
  from public, anon, authenticated;
grant execute on function public.get_post_comments_for_admin(uuid)
  to authenticated;
