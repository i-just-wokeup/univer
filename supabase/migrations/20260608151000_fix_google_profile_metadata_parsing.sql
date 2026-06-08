-- ============================================================
-- Fix Google profile metadata parsing
-- ============================================================
-- 국민대 Google full_name 형식: 심재성(학부생-자동차공학과)
-- real_name에는 이름만, department에는 학과만 저장한다.

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

WITH parsed_users AS (
  SELECT
    id,
    trim(
      replace(
        replace(
          replace(real_name, chr(8203), ''),
          chr(8204),
          ''
        ),
        chr(8205),
        ''
      )
    ) AS clean_name
  FROM public.users
  WHERE real_name LIKE '%(%-%)%'
)
UPDATE public.users
SET
  real_name = NULLIF(trim(regexp_replace(parsed_users.clean_name, '\s*\(.*\)\s*$', '')), ''),
  department = COALESCE(
    NULLIF(trim(substring(parsed_users.clean_name from '\([^)-]+-([^)]+)\)')), ''),
    public.users.department
  )
FROM parsed_users
WHERE public.users.id = parsed_users.id;
