-- 한 기기(푸시 토큰) = 한 계정만 수신하도록 보장.
-- 클라이언트는 RLS로 다른 유저 행을 못 비우므로, SECURITY DEFINER 함수로 처리.
-- 등록 시 이 토큰을 다른 계정에서 떼어내고(계정 전환 시 이전 계정 수신 방지) 현재 유저에 붙인다.
create or replace function public.claim_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or p_token is null then
    return;
  end if;

  -- 이 토큰을 가진 다른 계정에서 떼어낸다.
  update public.users
    set fcm_token = null
    where fcm_token = p_token
      and id <> auth.uid();

  -- 현재 유저에 등록.
  update public.users
    set fcm_token = p_token
    where id = auth.uid();
end;
$$;

revoke all on function public.claim_push_token(text) from public;
revoke all on function public.claim_push_token(text) from anon;
grant execute on function public.claim_push_token(text) to authenticated;
