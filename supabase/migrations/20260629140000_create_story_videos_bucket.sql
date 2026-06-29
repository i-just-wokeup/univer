-- story-videos 버킷 생성 (story-images/post-videos와 동일 패턴: public 버킷, authenticated 업로드/삭제)
-- 스토리 영상 업로드용. 영상 재생은 getPublicUrl(public 버킷).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('story-videos', 'story-videos', true, 52428800, array['video/mp4', 'video/quicktime'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "story_videos_authenticated_read" on storage.objects;
create policy "story_videos_authenticated_read"
  on storage.objects for select to authenticated
  using (bucket_id = 'story-videos');

drop policy if exists "story_videos_insert" on storage.objects;
create policy "story_videos_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'story-videos');

drop policy if exists "story_videos_delete" on storage.objects;
create policy "story_videos_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'story-videos' and auth.uid() = owner);
