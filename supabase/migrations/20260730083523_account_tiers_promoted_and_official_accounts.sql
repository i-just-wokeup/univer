-- 계정 등급 기반: 승격(is_promoted) 플래그 + 기관 계정(official_accounts) 테이블.
-- 승격 = 일반 유저 위에 얹는 크리에이터 뱃지, 기관 계정 = 공식(학생회·단과대)/동아리 조직 계정.
-- 알고리즘의 "밀어줄 계정"(스토리 권한/피드 재삽입/배지) = is_promoted OR official_accounts 존재.
-- 지정은 초기엔 관리자 직접 SQL(auth.uid null → 보호 트리거 우회). 상세: 노션 📺 피드/릴스 설계 9-8/9-9.

-- 승격 플래그
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_promoted boolean NOT NULL DEFAULT false;
-- 앱이 뱃지 표시로 읽을 수 있게 SELECT 권한 부여 (users는 컬럼별 grant 구조)
GRANT SELECT (is_promoted) ON public.users TO authenticated;

-- 자가 승격 방지: 보호 트리거에 is_promoted 차단 추가 (관리자는 service_role 직접 SQL=auth.uid null로 우회)
CREATE OR REPLACE FUNCTION public.prevent_sensitive_user_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  IF NEW.real_name IS DISTINCT FROM OLD.real_name THEN
    IF NOT (OLD.real_name IS NULL AND NEW.real_name IS NOT NULL) THEN
      RAISE EXCEPTION '실명(real_name)은 변경할 수 없습니다.';
    END IF;
  END IF;

  IF NEW.is_promoted IS DISTINCT FROM OLD.is_promoted THEN
    RAISE EXCEPTION '승격 상태(is_promoted)는 관리자만 변경할 수 있습니다.';
  END IF;

  IF NEW.credit_balance IS DISTINCT FROM OLD.credit_balance THEN
    RAISE EXCEPTION '크레딧(credit_balance)은 변경할 수 없습니다.';
  END IF;
  IF NEW.level IS DISTINCT FROM OLD.level THEN
    RAISE EXCEPTION '레벨(level)은 변경할 수 없습니다.';
  END IF;
  IF NEW.level_score IS DISTINCT FROM OLD.level_score THEN
    RAISE EXCEPTION '레벨 점수(level_score)는 변경할 수 없습니다.';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION '가입일(created_at)은 변경할 수 없습니다.';
  END IF;

  RETURN NEW;
END;
$function$;

-- 기관 계정 (공식/동아리 = 학생회·단과대·동아리 조직 계정)
CREATE TABLE IF NOT EXISTS public.official_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('official','club')),
  scope text NOT NULL DEFAULT 'school' CHECK (scope IN ('school','college','department')),
  target_department text,
  target_college text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: 조회는 전체 authenticated(뱃지·발견 탭), 쓰기 정책 없음 → 관리자(service_role 직접 SQL)만 생성/수정
ALTER TABLE public.official_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY official_accounts_select ON public.official_accounts
  FOR SELECT TO authenticated USING (true);
GRANT SELECT ON public.official_accounts TO authenticated;
