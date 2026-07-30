-- 프로필 공개여부 플래그 컬럼(department_public, real_name_public)에 SELECT 권한 부여.
--
-- users 테이블은 20260605 보안 패치(security_revoke_public_regrant_authenticated)로
-- authenticated 역할에 "안전 컬럼만" SELECT GRANT되어 있다. 20260730090000에서 추가한
-- 두 플래그 컬럼은 명시적 GRANT가 없어 select 시 permission denied가 발생했고,
-- 이 컬럼을 함께 조회하는 피드/프로필/내 활동/인증 쿼리가 전부 실패했다(피드·프로필 로드 불가).
-- 두 컬럼 모두 boolean 공개여부 플래그라 노출돼도 민감하지 않으므로 SELECT를 허용한다.
GRANT SELECT (department_public, real_name_public) ON public.users TO authenticated;
