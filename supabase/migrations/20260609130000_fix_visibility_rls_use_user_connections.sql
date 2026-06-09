-- ============================================================
-- 공개범위(close_friends) RLS를 user_connections 크루 관계 기준으로 교체
-- ============================================================
-- 기존 정책은 close_friends 테이블을 참조했으나, 실제 크루 관계는
-- user_connections(status='accepted') 테이블로 관리된다.
-- close_friends 테이블은 비어 있어 크루공개 게시물/스토리가
-- 작성자에게만 보이던 문제를 수정한다.

DROP POLICY IF EXISTS posts_read_same_university ON public.posts;
CREATE POLICY posts_read_same_university ON public.posts
FOR SELECT
USING (
  (user_id = auth.uid())
  OR (
    deleted_at IS NULL
    AND university_id = (
      SELECT users.university_id FROM public.users WHERE users.id = auth.uid()
    )
    AND (
      visibility = 'public'
      OR (
        visibility = 'close_friends'
        AND EXISTS (
          SELECT 1 FROM public.user_connections uc
          WHERE uc.status = 'accepted'
            AND (
              (uc.requester_id = posts.user_id AND uc.receiver_id = auth.uid())
              OR (uc.requester_id = auth.uid() AND uc.receiver_id = posts.user_id)
            )
        )
      )
    )
  )
);

DROP POLICY IF EXISTS stories_read_same_university ON public.stories;
CREATE POLICY stories_read_same_university ON public.stories
FOR SELECT
USING (
  (user_id = auth.uid())
  OR (
    deleted_at IS NULL
    AND expires_at > now()
    AND university_id = (
      SELECT users.university_id FROM public.users WHERE users.id = auth.uid()
    )
    AND (
      visibility = 'public'
      OR (
        visibility = 'close_friends'
        AND EXISTS (
          SELECT 1 FROM public.user_connections uc
          WHERE uc.status = 'accepted'
            AND (
              (uc.requester_id = stories.user_id AND uc.receiver_id = auth.uid())
              OR (uc.requester_id = auth.uid() AND uc.receiver_id = stories.user_id)
            )
        )
      )
    )
  )
);
