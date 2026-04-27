-- close_friends 테이블 생성 후 visibility RLS 업데이트

-- posts visibility RLS 업데이트 (close_friends 반영)
DROP POLICY IF EXISTS "posts_read_same_university" ON posts;
CREATE POLICY "posts_read_same_university" ON posts
  FOR SELECT USING (
    university_id = (SELECT university_id FROM users WHERE id = auth.uid())
    AND deleted_at IS NULL
    AND (
      visibility = 'public'
      OR user_id = auth.uid()
      OR (
        visibility = 'close_friends'
        AND EXISTS (
          SELECT 1 FROM close_friends
          WHERE user_id = posts.user_id AND friend_id = auth.uid()
        )
      )
    )
  );

-- stories visibility RLS 업데이트 (close_friends 반영)
DROP POLICY IF EXISTS "stories_read_same_university" ON stories;
CREATE POLICY "stories_read_same_university" ON stories
  FOR SELECT USING (
    university_id = (SELECT university_id FROM users WHERE id = auth.uid())
    AND deleted_at IS NULL
    AND (expires_at > now() OR user_id = auth.uid())
    AND (
      visibility = 'public'
      OR user_id = auth.uid()
      OR (
        visibility = 'close_friends'
        AND EXISTS (
          SELECT 1 FROM close_friends
          WHERE user_id = stories.user_id AND friend_id = auth.uid()
        )
      )
    )
  );
