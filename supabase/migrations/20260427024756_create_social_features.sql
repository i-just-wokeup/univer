-- ================================
-- post_likes (게시물 + 스토리 통합)
-- ================================
CREATE TABLE post_likes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('post', 'story')),
  target_id   uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

-- ================================
-- comments
-- ================================
CREATE TABLE comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  post_id    uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id  uuid REFERENCES comments(id) ON DELETE CASCADE,
  content    text NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ================================
-- comment_likes
-- ================================
CREATE TABLE comment_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

-- ================================
-- user_likes (팔로우 대체)
-- ================================
CREATE TABLE user_likes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notify       bool NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(from_user_id, to_user_id)
);

-- ================================
-- close_friends (친한친구 - 일방적)
-- ================================
CREATE TABLE close_friends (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- ================================
-- hashtags
-- ================================
CREATE TABLE hashtags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ================================
-- post_hashtags
-- ================================
CREATE TABLE post_hashtags (
  post_id    uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id uuid NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  PRIMARY KEY(post_id, hashtag_id)
);

-- ================================
-- bookmarks (게시물만)
-- ================================
CREATE TABLE bookmarks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id    uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE close_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_likes_read" ON post_likes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "post_likes_insert" ON post_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "post_likes_delete" ON post_likes FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "comments_read" ON comments
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM posts
      WHERE university_id = (SELECT university_id FROM users WHERE id = auth.uid())
    )
    AND deleted_at IS NULL
  );
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "comments_update_own" ON comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "comments_delete_own" ON comments FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "comment_likes_read" ON comment_likes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "comment_likes_insert" ON comment_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "comment_likes_delete" ON comment_likes FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "user_likes_read" ON user_likes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "user_likes_insert" ON user_likes FOR INSERT WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "user_likes_update_own" ON user_likes FOR UPDATE USING (from_user_id = auth.uid());
CREATE POLICY "user_likes_delete" ON user_likes FOR DELETE USING (from_user_id = auth.uid());

CREATE POLICY "close_friends_read_own" ON close_friends FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "close_friends_insert" ON close_friends FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "close_friends_delete" ON close_friends FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "hashtags_read" ON hashtags FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "hashtags_insert" ON hashtags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "post_hashtags_read" ON post_hashtags FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "post_hashtags_insert" ON post_hashtags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "post_hashtags_delete" ON post_hashtags FOR DELETE USING (
  EXISTS (SELECT 1 FROM posts WHERE id = post_hashtags.post_id AND user_id = auth.uid())
);

CREATE POLICY "bookmarks_read_own" ON bookmarks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "bookmarks_insert" ON bookmarks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "bookmarks_delete" ON bookmarks FOR DELETE USING (user_id = auth.uid());
