-- ============================================================
-- users 테이블 RLS 활성화 + 민감 컬럼 변경 방지
-- ============================================================
-- 배경:
-- - users 테이블 RLS가 비활성화 상태였음 → anon key REST 호출로 모든 유저 민감정보 노출
-- - users_update_own 정책이 컬럼 제한 없어서 role/university_id/is_active 등 자유 변경 가능
--   → 자가 admin 승격 가능 등 심각한 취약점
-- 해결:
-- - RLS 활성화 + 재귀 없는 SELECT 정책 (auth.uid() JWT 직접 조회)
-- - BEFORE UPDATE 트리거로 민감 컬럼 변경 차단
-- ============================================================

-- 1. RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 제거 (혹시 있을 경우)
DROP POLICY IF EXISTS users_select ON public.users;
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;

-- 3. SELECT 정책
CREATE POLICY users_select ON public.users
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND auth.uid() IS NOT NULL
  );

-- 본인은 deleted_at 무관하게 조회 가능 (탈퇴 후 복구 흐름 대비)
CREATE POLICY users_select_own ON public.users
  FOR SELECT
  USING (id = auth.uid());

-- 4. UPDATE 정책 (본인 row만)
CREATE POLICY users_update_own ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 5. 민감 컬럼 변경 방지 트리거 함수
CREATE OR REPLACE FUNCTION public.prevent_sensitive_user_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- service_role / postgres 직접 접근은 bypass
  -- (handle_new_user, admin migration 등은 auth.uid() = NULL)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- role: 절대 변경 불가 (자가 admin 승격 방지)
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION '권한(role)은 변경할 수 없습니다.';
  END IF;

  -- university_id: 학교는 가입 시 확정, 이후 변경 불가
  IF NEW.university_id IS DISTINCT FROM OLD.university_id THEN
    RAISE EXCEPTION '학교(university_id)는 변경할 수 없습니다.';
  END IF;

  -- is_active: 관리자만 변경 가능 (계정 차단 등)
  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION '계정 활성 상태(is_active)는 변경할 수 없습니다.';
  END IF;

  -- is_onboarded: false → true 1회만 허용 (온보딩 완료), 역방향 불가
  IF NEW.is_onboarded IS DISTINCT FROM OLD.is_onboarded THEN
    IF NOT (OLD.is_onboarded = false AND NEW.is_onboarded = true) THEN
      RAISE EXCEPTION '온보딩 상태(is_onboarded)는 되돌릴 수 없습니다.';
    END IF;
  END IF;

  -- email: 변경 불가
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION '이메일(email)은 변경할 수 없습니다.';
  END IF;

  -- real_name: 실명은 변경 불가 (실명 SNS 정책)
  IF NEW.real_name IS DISTINCT FROM OLD.real_name THEN
    RAISE EXCEPTION '실명(real_name)은 변경할 수 없습니다.';
  END IF;

  -- credit_balance / level / level_score: 시스템 컬럼, 변경 불가
  IF NEW.credit_balance IS DISTINCT FROM OLD.credit_balance THEN
    RAISE EXCEPTION '크레딧(credit_balance)은 변경할 수 없습니다.';
  END IF;
  IF NEW.level IS DISTINCT FROM OLD.level THEN
    RAISE EXCEPTION '레벨(level)은 변경할 수 없습니다.';
  END IF;
  IF NEW.level_score IS DISTINCT FROM OLD.level_score THEN
    RAISE EXCEPTION '레벨 점수(level_score)는 변경할 수 없습니다.';
  END IF;

  -- created_at: 변경 불가
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION '가입일(created_at)은 변경할 수 없습니다.';
  END IF;

  RETURN NEW;
END;
$$;

-- 6. 트리거 연결
DROP TRIGGER IF EXISTS trg_prevent_sensitive_user_update ON public.users;
CREATE TRIGGER trg_prevent_sensitive_user_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_sensitive_user_update();
