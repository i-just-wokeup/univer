-- ================================
-- posts
-- ================================
CREATE TABLE posts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content        text,
  views_count    int NOT NULL DEFAULT 0,
  likes_count    int NOT NULL DEFAULT 0,
  comments_count int NOT NULL DEFAULT 0,
  university_id  uuid NOT NULL REFERENCES universities(id),
  visibility     text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'close_friends')),
  deleted_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ================================
-- post_images
-- ================================
CREATE TABLE post_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  url         text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ================================
-- stories
-- ================================
CREATE TABLE stories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url     text NOT NULL,
  university_id uuid NOT NULL REFERENCES universities(id),
  views_count   int NOT NULL DEFAULT 0,
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  is_archived   bool NOT NULL DEFAULT false,
  visibility    text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'close_friends')),
  deleted_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ================================
-- story_views
-- ================================
CREATE TABLE story_views (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id   uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_read_same_university" ON posts
  FOR SELECT USING (
    university_id = (SELECT university_id FROM users WHERE id = auth.uid())
    AND deleted_at IS NULL
  );

CREATE POLICY "posts_insert_own" ON posts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "posts_update_own" ON posts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "posts_delete_own" ON posts
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "post_images_read" ON post_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM posts WHERE id = post_images.post_id AND deleted_at IS NULL)
  );

CREATE POLICY "post_images_insert_own" ON post_images
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM posts WHERE id = post_images.post_id AND user_id = auth.uid())
  );

CREATE POLICY "post_images_delete_own" ON post_images
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM posts WHERE id = post_images.post_id AND user_id = auth.uid())
  );

CREATE POLICY "stories_read_same_university" ON stories
  FOR SELECT USING (
    university_id = (SELECT university_id FROM users WHERE id = auth.uid())
    AND deleted_at IS NULL
    AND (expires_at > now() OR user_id = auth.uid())
  );

CREATE POLICY "stories_insert_own" ON stories
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "stories_update_own" ON stories
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "stories_delete_own" ON stories
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "story_views_insert" ON story_views
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "story_views_read_owner" ON story_views
  FOR SELECT USING (
    story_id IN (SELECT id FROM stories WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );
