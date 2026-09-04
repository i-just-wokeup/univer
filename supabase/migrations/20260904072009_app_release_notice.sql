-- 스토어 업데이트 안내용 릴리스 정보.
-- Play 자동 업데이트를 꺼둔 사용자는 새 AAB를 올려도 옛 버전에 머문다.
-- 앱이 자기 버전과 비교해 낮으면 안내를 띄우고 스토어로 보낸다.
--
-- 표시 정책은 앱이 담당한다: 버전당 한 번만 표시하고, 조회는 하루 한 번으로 제한한다.
-- min_version은 강제 업데이트용이며 지금은 비워 둔다(코드는 있고 스위치만 꺼둔 상태).

create table if not exists public.app_release (
  platform       text primary key check (platform in ('android', 'ios')),
  latest_version text not null,
  min_version    text,
  store_url      text not null,
  message        text,
  updated_at     timestamptz not null default now()
);

alter table public.app_release enable row level security;

-- 읽기는 로그인 사용자 모두. 쓰기 정책은 두지 않아 일반 사용자는 변경할 수 없다
-- (관리자는 대시보드나 service_role로 갱신한다).
drop policy if exists app_release_select on public.app_release;
create policy app_release_select
  on public.app_release
  for select
  to authenticated
  using (true);

insert into public.app_release (platform, latest_version, min_version, store_url, message)
values
  ('android', '1.0.0', null,
   'https://play.google.com/store/apps/details?id=com.univer.app', null),
  ('ios', '1.0.0', null,
   'https://apps.apple.com/app/unip/id6803396414', null)
on conflict (platform) do nothing;
