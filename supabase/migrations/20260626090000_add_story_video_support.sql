-- ================================
-- stories: 영상 지원 추가 (post_media와 동일한 방식)
-- image_url 은 영상일 때 영상 파일 URL 을 담는다(기존 컬럼 재사용).
-- ================================
ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS duration int;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'stories_type_check'
      AND conrelid = 'public.stories'::regclass
  ) THEN
    ALTER TABLE stories
      ADD CONSTRAINT stories_type_check CHECK (type IN ('image', 'video'));
  END IF;
END $$;
