-- 계정 배지(학생회/동아리/승격)를 종류별로 구분해 내려주는 RPC.
-- 기존 get_verified_user_ids()는 공식+승격을 한 덩어리 id 목록으로만 줘서 배지 종류 구분 불가.
-- 이 RPC는 배지가 있는 유저마다 affiliation(council/club/null) + promoted(bool)을 한 행으로 반환한다.
-- (크루는 표시하지 않기로 결정 — 여기 포함하지 않음)

CREATE OR REPLACE FUNCTION public.get_account_badges()
RETURNS TABLE(user_id uuid, affiliation text, promoted boolean)
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
  with affiliations as (
    select distinct on (oa.user_id)
      oa.user_id,
      case oa.type
        when 'official' then 'council'
        when 'club' then 'club'
        else null
      end as affiliation
    from public.official_accounts oa
    where oa.verified_at is not null
    order by oa.user_id, oa.type
  ),
  promoted_users as (
    select id as user_id from public.users where is_promoted = true
  ),
  badged as (
    select user_id from affiliations
    union
    select user_id from promoted_users
  )
  select
    b.user_id,
    a.affiliation,
    (p.user_id is not null) as promoted
  from badged b
  left join affiliations a on a.user_id = b.user_id
  left join promoted_users p on p.user_id = b.user_id
$function$;

grant execute on function public.get_account_badges() to authenticated, anon;
