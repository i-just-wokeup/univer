-- 댓글 신고 지원: fill_report_snapshot 트리거에 target_type='comment' 분기 추가.
-- 신고 시 댓글 내용/작성자를 스냅샷으로 저장해 관리자 화면에서 확인 가능하게 한다.
-- (reports.target_type CHECK는 이미 'comment' 허용됨)
CREATE OR REPLACE FUNCTION public.fill_report_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.target_type = 'post' THEN
    SELECT
      jsonb_build_object(
        'content', p.content,
        'thumbnail_url', (SELECT pm.url FROM public.post_media pm WHERE pm.post_id = p.id ORDER BY pm.order_index ASC LIMIT 1)
      ),
      p.user_id
    INTO NEW.target_snapshot, NEW.target_author_id
    FROM public.posts p WHERE p.id = NEW.target_id;
  ELSIF NEW.target_type = 'story' THEN
    SELECT
      jsonb_build_object('content', NULL, 'thumbnail_url', s.image_url),
      s.user_id
    INTO NEW.target_snapshot, NEW.target_author_id
    FROM public.stories s WHERE s.id = NEW.target_id;
  ELSIF NEW.target_type = 'comment' THEN
    SELECT
      jsonb_build_object('content', c.content, 'thumbnail_url', NULL),
      c.user_id
    INTO NEW.target_snapshot, NEW.target_author_id
    FROM public.comments c WHERE c.id = NEW.target_id;
  END IF;
  RETURN NEW;
END;
$function$;
