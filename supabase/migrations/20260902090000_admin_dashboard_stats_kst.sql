-- 관리자 대시보드 집계 정정
-- 1) 기간 경계를 UTC(CURRENT_DATE)에서 KST로 교체한다.
--    기존 CURRENT_DATE는 UTC 자정 = KST 오전 9시라 한국 시간 새벽 0~9시 활동이 "오늘"에서 빠졌다.
--    텔레그램 운영봇이 KST 기준이라 두 숫자가 서로 달랐던 원인이기도 하다.
-- 2) soft delete된 행을 제외한다. deleted_at 컬럼이 있는 users/posts/stories에만 적용한다.
--    comments/post_likes/comment_likes/reports에는 deleted_at이 없다(하드 삭제).
-- 반환 JSON 구조는 그대로 유지한다(웹 호출부 변경 없음).

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result json;
  v_day   timestamptz := date_trunc('day',   now() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul';
  v_month timestamptz := date_trunc('month', now() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul';
  v_year  timestamptz := date_trunc('year',  now() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'users', json_build_object(
      'today',(SELECT COUNT(*) FROM public.users WHERE deleted_at IS NULL AND created_at>=v_day),
      'month',(SELECT COUNT(*) FROM public.users WHERE deleted_at IS NULL AND created_at>=v_month),
      'year', (SELECT COUNT(*) FROM public.users WHERE deleted_at IS NULL AND created_at>=v_year),
      'total',(SELECT COUNT(*) FROM public.users WHERE deleted_at IS NULL)
    ),
    'posts', json_build_object(
      'today',(SELECT COUNT(*) FROM public.posts WHERE deleted_at IS NULL AND created_at>=v_day),
      'month',(SELECT COUNT(*) FROM public.posts WHERE deleted_at IS NULL AND created_at>=v_month),
      'year', (SELECT COUNT(*) FROM public.posts WHERE deleted_at IS NULL AND created_at>=v_year),
      'total',(SELECT COUNT(*) FROM public.posts WHERE deleted_at IS NULL)
    ),
    'stories', json_build_object(
      'today',(SELECT COUNT(*) FROM public.stories WHERE deleted_at IS NULL AND created_at>=v_day),
      'month',(SELECT COUNT(*) FROM public.stories WHERE deleted_at IS NULL AND created_at>=v_month),
      'year', (SELECT COUNT(*) FROM public.stories WHERE deleted_at IS NULL AND created_at>=v_year),
      'total',(SELECT COUNT(*) FROM public.stories WHERE deleted_at IS NULL)
    ),
    'comments', json_build_object(
      'today',(SELECT COUNT(*) FROM public.comments WHERE created_at>=v_day),
      'month',(SELECT COUNT(*) FROM public.comments WHERE created_at>=v_month),
      'year', (SELECT COUNT(*) FROM public.comments WHERE created_at>=v_year),
      'total',(SELECT COUNT(*) FROM public.comments)
    ),
    'likes', json_build_object(
      'today',(SELECT COUNT(*) FROM public.post_likes WHERE created_at>=v_day)+(SELECT COUNT(*) FROM public.comment_likes WHERE created_at>=v_day),
      'month',(SELECT COUNT(*) FROM public.post_likes WHERE created_at>=v_month)+(SELECT COUNT(*) FROM public.comment_likes WHERE created_at>=v_month),
      'year', (SELECT COUNT(*) FROM public.post_likes WHERE created_at>=v_year)+(SELECT COUNT(*) FROM public.comment_likes WHERE created_at>=v_year),
      'total',(SELECT COUNT(*) FROM public.post_likes)+(SELECT COUNT(*) FROM public.comment_likes)
    ),
    'reports', json_build_object(
      'pending',(SELECT COUNT(*) FROM public.reports WHERE status='pending'),
      'today',  (SELECT COUNT(*) FROM public.reports WHERE created_at>=v_day),
      'month',  (SELECT COUNT(*) FROM public.reports WHERE created_at>=v_month),
      'total',  (SELECT COUNT(*) FROM public.reports)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$function$;
