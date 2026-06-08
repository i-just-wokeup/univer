-- ============================================================
-- User favorites
-- ============================================================
-- 내 활동 > 즐겨찾기 계정 및 프로필 즐겨찾기 토글에 사용한다.

CREATE TABLE IF NOT EXISTS public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  favorite_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_favorites_not_self CHECK (user_id <> favorite_user_id),
  CONSTRAINT user_favorites_unique UNIQUE (user_id, favorite_user_id)
);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_favorites_read_own" ON public.user_favorites;
DROP POLICY IF EXISTS "user_favorites_insert_own" ON public.user_favorites;
DROP POLICY IF EXISTS "user_favorites_delete_own" ON public.user_favorites;

CREATE POLICY "user_favorites_read_own"
ON public.user_favorites
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "user_favorites_insert_own"
ON public.user_favorites
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND user_id <> favorite_user_id
);

CREATE POLICY "user_favorites_delete_own"
ON public.user_favorites
FOR DELETE
USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS user_favorites_user_created_idx
ON public.user_favorites (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_favorites_target_idx
ON public.user_favorites (favorite_user_id);
