-- 공식 계정(학생회/동아리) 관리용 admin RPC 3종.
-- 생성은 auth.admin.createUser가 필요해 Edge Function(create-official-account)에서 처리하고,
-- 조회/유형변경/해제는 service_role 없이 되므로 여기 SECURITY DEFINER RPC로 둔다.
-- 모든 함수는 호출자 users.role='admin' 을 검증한다. (일반 유저 직접 호출 차단)

-- 목록 조회: 공식 계정 + 유저 표시 정보(단체명=real_name, 이메일 포함)
create or replace function public.list_official_accounts()
returns table (
  user_id uuid,
  nickname text,
  org_name text,
  email text,
  type text,
  verified_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if (select role from public.users where id = auth.uid()) is distinct from 'admin' then
    raise exception 'Not authorized';
  end if;

  return query
    select
      oa.user_id,
      u.nickname,
      u.real_name as org_name,
      u.email,
      oa.type,
      oa.verified_at,
      oa.created_at
    from public.official_accounts oa
    join public.users u on u.id = oa.user_id
    order by oa.created_at desc;
end;
$$;

-- 유형 변경: official(학생회) <-> club(동아리)
create or replace function public.set_official_type(p_user_id uuid, p_type text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if (select role from public.users where id = auth.uid()) is distinct from 'admin' then
    raise exception 'Not authorized';
  end if;

  if p_type not in ('official', 'club') then
    raise exception 'Invalid official type: %', p_type;
  end if;

  update public.official_accounts
  set type = p_type
  where user_id = p_user_id;
end;
$$;

-- 공식 해제: official_accounts 행 삭제 → 배지/스토리 권한 회수 (계정 자체는 유지)
create or replace function public.revoke_official(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if (select role from public.users where id = auth.uid()) is distinct from 'admin' then
    raise exception 'Not authorized';
  end if;

  delete from public.official_accounts
  where user_id = p_user_id;
end;
$$;

-- 실행 권한: 인증 유저에게만 (내부 admin 검증이 최종 게이트). anon/public 차단.
revoke execute on function public.list_official_accounts() from anon, public;
revoke execute on function public.set_official_type(uuid, text) from anon, public;
revoke execute on function public.revoke_official(uuid) from anon, public;

grant execute on function public.list_official_accounts() to authenticated;
grant execute on function public.set_official_type(uuid, text) to authenticated;
grant execute on function public.revoke_official(uuid) to authenticated;
