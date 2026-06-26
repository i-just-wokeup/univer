-- 이미지 버킷에 용량/형식 제한 추가 (post-videos와 동일한 보안 기본값)
-- 익명 업로드는 기존 정책상 이미 차단됨. 여기서는 거대/비이미지 파일 업로드 악용을 막는다.
UPDATE storage.buckets
SET file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']
WHERE id = 'avatars';

UPDATE storage.buckets
SET file_size_limit = 10485760, -- 10MB
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']
WHERE id IN ('post-images','story-images');
