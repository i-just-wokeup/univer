-- 승격(프로 계정) 신청 자격 상향: 최근 30일 게시물 3개 → 5개.
-- 총 10개 조건은 유지, "지금도 활발히 올리는" 계정만 통과하도록 30일 기준만 올림.
-- request_promotion 전체를 create or replace로 재정의(threshold와 에러 문구만 변경).

create or replace function public.request_promotion()
 returns json
 language plpgsql
 security definer
 set search_path to ''
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

  if v_posts_count < 10 or v_posts_30d < 5 then
    raise exception '게시물 10개 이상, 최근 30일 게시물 5개 이상이 필요합니다.';
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
