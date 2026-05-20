-- ================================
-- post_images -> post_media
-- ================================
DO $$
BEGIN
  IF to_regclass('public.post_media') IS NULL
    AND to_regclass('public.post_images') IS NOT NULL THEN
    ALTER TABLE post_images RENAME TO post_media;
  ELSIF to_regclass('public.post_media') IS NULL THEN
    CREATE TABLE post_media (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id     uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      url         text NOT NULL,
      order_index int NOT NULL DEFAULT 0,
      created_at  timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

ALTER TABLE post_media
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS duration int;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'post_media_type_check'
      AND conrelid = 'public.post_media'::regclass
  ) THEN
    ALTER TABLE post_media
      ADD CONSTRAINT post_media_type_check CHECK (type IN ('image', 'video'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON post_media(post_id);

ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_images_read" ON post_media;
DROP POLICY IF EXISTS "post_images_insert_own" ON post_media;
DROP POLICY IF EXISTS "post_images_delete_own" ON post_media;
DROP POLICY IF EXISTS "post_media_read" ON post_media;
DROP POLICY IF EXISTS "post_media_insert_own" ON post_media;
DROP POLICY IF EXISTS "post_media_delete_own" ON post_media;

CREATE POLICY "post_media_read" ON post_media
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM posts WHERE id = post_media.post_id AND deleted_at IS NULL)
  );

CREATE POLICY "post_media_insert_own" ON post_media
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM posts WHERE id = post_media.post_id AND user_id = auth.uid())
  );

CREATE POLICY "post_media_delete_own" ON post_media
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM posts WHERE id = post_media.post_id AND user_id = auth.uid())
  );

-- ================================
-- reports
-- ================================
ALTER TABLE reports
  ALTER COLUMN reason DROP NOT NULL,
  ALTER COLUMN status SET DEFAULT 'pending';

DO $$
DECLARE
  check_constraint_name text;
BEGIN
  FOR check_constraint_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.reports'::regclass
      AND contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE reports DROP CONSTRAINT %I', check_constraint_name);
  END LOOP;
END $$;

ALTER TABLE reports
  ADD CONSTRAINT reports_target_type_check CHECK (target_type IN ('post', 'story', 'user')),
  ADD CONSTRAINT reports_status_check CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken'));

CREATE UNIQUE INDEX IF NOT EXISTS reports_reporter_target_unique
  ON reports(reporter_id, target_type, target_id);
