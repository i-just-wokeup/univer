-- 스토리 배경색. 미디어(영상/사진)가 9:16을 꽉 채우지 않을 때(레터박스) 보이는 배경.
-- null이면 클라이언트 기본값(검정) 사용. 인스타식 단색 배경 선택용.
alter table public.stories
  add column if not exists background_color text;
