-- ============================================================
-- Allow deleted user nickname reuse
-- ============================================================

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_nickname_unique;
DROP INDEX IF EXISTS public.users_nickname_lower_unique;

CREATE UNIQUE INDEX IF NOT EXISTS users_active_nickname_lower_unique
ON public.users ((lower(nickname)))
WHERE deleted_at IS NULL;
