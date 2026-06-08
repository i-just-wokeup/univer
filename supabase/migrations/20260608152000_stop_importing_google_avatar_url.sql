-- ============================================================
-- Stop importing Google avatar URL
-- ============================================================
-- Google OAuth에서는 실명/학과만 사용하고, 프로필 사진은 앱 자체 업로드만 사용한다.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_name text := NULLIF(
    COALESCE(
      NEW.raw_user_meta_data->>'real_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    ),
    ''
  );
  v_clean_name text := trim(
    replace(
      replace(
        replace(COALESCE(v_profile_name, ''), chr(8203), ''),
        chr(8204),
        ''
      ),
      chr(8205),
      ''
    )
  );
  v_real_name text := NULLIF(trim(regexp_replace(v_clean_name, '\s*\(.*\)\s*$', '')), '');
  v_department text := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'department', ''),
    NULLIF(trim(substring(v_clean_name from '\([^)-]+-([^)]+)\)')), ''),
    ''
  );
BEGIN
  INSERT INTO public.users (
    id,
    email,
    real_name,
    nickname,
    university_id,
    department
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_real_name,
    'user_' || substr(replace(NEW.id::text, '-', ''), 1, 12),
    (SELECT id FROM public.universities WHERE is_active = true LIMIT 1),
    v_department
  );

  RETURN NEW;
END;
$$;

UPDATE public.users
SET avatar_url = NULL
WHERE avatar_url LIKE 'https://lh3.googleusercontent.com/%';
