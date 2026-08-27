-- 팔로우 대상을 기관(official_accounts)·승격(users.is_promoted) 계정으로 제한한다.
-- 일반 학생 간 관계는 크루(user_connections)가 담당하며, 팔로우는 별개 레이어로 유지한다.
-- 기존 follows_insert 정책은 follower_id = auth.uid()만 검사해, 앱 UI를 우회해
-- REST로 직접 INSERT하면 일반 학생도 팔로우할 수 있었다.
-- 탈퇴(deleted_at)·비활성(is_active=false) 계정도 대상에서 제외한다.

drop policy if exists follows_insert on public.follows;

create policy follows_insert on public.follows
  for insert
  to authenticated
  with check (
    follows.follower_id = auth.uid()
    and exists (
      select 1
      from public.users u
      left join public.official_accounts oa on oa.user_id = u.id
      where u.id = follows.following_id
        and u.deleted_at is null
        and u.is_active
        and (u.is_promoted or oa.user_id is not null)
    )
  );
