-- ============================================================
-- Google auth profile metadata support
-- ============================================================
-- 신규 가입 시 auth metadata의 실명/아바타/학과 값을 public.users에 반영한다.
-- 이메일 가입 유저는 온보딩에서 real_name을 최초 1회만 채울 수 있도록 보호 트리거를 보강한다.

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
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'nickname', ''),
      split_part(NEW.email, '@', 1)
    ),
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
    (SELECT id FROM public.universities WHERE is_active = true LIMIT 1),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'department', ''), '')
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_sensitive_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION '권한(role)은 변경할 수 없습니다.';
  END IF;

  IF NEW.university_id IS DISTINCT FROM OLD.university_id THEN
    RAISE EXCEPTION '학교(university_id)는 변경할 수 없습니다.';
  END IF;

  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION '계정 활성 상태(is_active)는 변경할 수 없습니다.';
  END IF;

  IF NEW.is_onboarded IS DISTINCT FROM OLD.is_onboarded THEN
    IF NOT (OLD.is_onboarded = false AND NEW.is_onboarded = true) THEN
      RAISE EXCEPTION '온보딩 상태(is_onboarded)는 되돌릴 수 없습니다.';
    END IF;
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION '이메일(email)은 변경할 수 없습니다.';
  END IF;

  -- 실명은 비어 있는 상태에서 최초 1회만 입력 가능하다.
  IF NEW.real_name IS DISTINCT FROM OLD.real_name THEN
    IF NOT (OLD.real_name IS NULL AND NEW.real_name IS NOT NULL) THEN
      RAISE EXCEPTION '실명(real_name)은 변경할 수 없습니다.';
    END IF;
  END IF;

  IF NEW.credit_balance IS DISTINCT FROM OLD.credit_balance THEN
    RAISE EXCEPTION '크레딧(credit_balance)은 변경할 수 없습니다.';
  END IF;

  IF NEW.level IS DISTINCT FROM OLD.level THEN
    RAISE EXCEPTION '레벨(level)은 변경할 수 없습니다.';
  END IF;

  IF NEW.level_score IS DISTINCT FROM OLD.level_score THEN
    RAISE EXCEPTION '레벨 점수(level_score)은 변경할 수 없습니다.';
  END IF;

  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION '가입일(created_at)은 변경할 수 없습니다.';
  END IF;

  RETURN NEW;
END;
$$;
