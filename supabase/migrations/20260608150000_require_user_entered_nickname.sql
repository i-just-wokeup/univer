-- ============================================================
-- Require user-entered nickname during onboarding
-- ============================================================
-- 공개 닉네임이 이메일 앞부분으로 노출되지 않도록 신규 유저 기본 닉네임을
-- 임시값(user_xxxxxxxxxxxx)으로 생성한다.

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_nickname_unique;
DROP INDEX IF EXISTS public.users_nickname_lower_unique;

CREATE UNIQUE INDEX IF NOT EXISTS users_active_nickname_lower_unique
ON public.users ((lower(nickname)))
WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    real_name,
    nickname,
    avatar_url,
    university_id,
    department
  )
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(
      COALESCE(
        NEW.raw_user_meta_data->>'real_name',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name'
      ),
      ''
    ),
    'user_' || substr(replace(NEW.id::text, '-', ''), 1, 12),
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
    (SELECT id FROM public.universities WHERE is_active = true LIMIT 1),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'department', ''), '')
  );

  RETURN NEW;
END;
$$;
