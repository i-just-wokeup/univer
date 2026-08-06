-- 학과 공개 기본값을 공개(true) → 숨김(false)로.
-- 실명(real_name_public)과 동일하게 opt-in 처리: 신규 가입자는 학과가 자동으로 숨겨지고,
-- 본인이 프로필 설정에서 켜야 공개된다. (프라이버시 부담 완화)
-- 기존 유저의 값은 바꾸지 않음(테스트 계정 포함). handle_new_user 트리거는
-- department_public을 명시하지 않아 이 기본값을 따른다.

alter table public.users alter column department_public set default false;
