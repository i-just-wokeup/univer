-- 보안 하드닝 (Supabase advisor WARN 대응). 앱 동작 영향 없음.
-- 1) 공개 버킷의 광범위 SELECT(목록) 정책 제거 — 공개 버킷은 URL(/object/public/)로 접근하므로
--    이 정책이 없어도 이미지/영상은 그대로 보인다. 있으면 인증 유저가 버킷 전체 파일명을 나열 가능.
drop policy if exists "avatars_authenticated_read" on storage.objects;
drop policy if exists "post_images_authenticated_read" on storage.objects;
drop policy if exists "post_videos_authenticated_read" on storage.objects;
drop policy if exists "story_images_authenticated_read" on storage.objects;
drop policy if exists "story_videos_authenticated_read" on storage.objects;

-- 2) 트리거 함수는 RPC로 직접 호출되면 안 된다(트리거는 EXECUTE 권한과 무관하게 동작).
--    anon/authenticated 모두에게서 EXECUTE 회수.
revoke execute on function public.push_on_message() from anon, authenticated;
revoke execute on function public.push_on_notification() from anon, authenticated;

-- 3) 차단 관련 함수는 로그인 유저 전용. 비로그인(anon)에게서 EXECUTE 회수(authenticated는 유지).
revoke execute on function public.block_user(uuid) from anon;
revoke execute on function public.unblock_user(uuid) from anon;
revoke execute on function public.get_blocked_users() from anon;
revoke execute on function public.get_block_related_user_ids() from anon;
