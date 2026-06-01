-- ============================================================
-- Profile external links
-- ============================================================
-- 여러 개의 외부 링크를 프로필에 연결할 수 있도록 별도 테이블로 관리한다.
-- MVP UI는 대표 링크 1개만 입력하지만, order_index 기반으로 다중 링크 확장이 가능하다.

CREATE TABLE IF NOT EXISTS public.profile_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label       text NOT NULL,
  url         text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_links_url_http CHECK (url ~* '^https?://')
);

CREATE INDEX IF NOT EXISTS profile_links_user_order_idx
  ON public.profile_links (user_id, order_index, created_at);

ALTER TABLE public.profile_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profile_links_select ON public.profile_links;
DROP POLICY IF EXISTS profile_links_insert_own ON public.profile_links;
DROP POLICY IF EXISTS profile_links_update_own ON public.profile_links;
DROP POLICY IF EXISTS profile_links_delete_own ON public.profile_links;

CREATE POLICY profile_links_select ON public.profile_links
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id = profile_links.user_id
        AND users.deleted_at IS NULL
    )
  );

CREATE POLICY profile_links_insert_own ON public.profile_links
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY profile_links_update_own ON public.profile_links
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY profile_links_delete_own ON public.profile_links
  FOR DELETE
  USING (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
