ALTER TABLE posts
ADD COLUMN IF NOT EXISTS aspect_ratio text NOT NULL DEFAULT 'portrait';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'posts_aspect_ratio_check'
  ) THEN
    ALTER TABLE posts
    ADD CONSTRAINT posts_aspect_ratio_check
    CHECK (aspect_ratio IN ('square', 'portrait', 'landscape'));
  END IF;
END $$;
