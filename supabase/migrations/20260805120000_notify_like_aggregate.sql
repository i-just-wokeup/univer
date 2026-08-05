-- 좋아요 알림 인스타식 집계(맨 위로 올리기)
-- 기존: 첫 좋아요만 알림 생성, 이후 좋아요는 아무 변화 없음(박제).
-- 변경: 이미 알림이 있으면 새로 만들지 않고 created_at 갱신 + is_read=false 로 맨 위로 끌어올린다.
--       "누가 눌렀는지/총 인원"은 앱에서 좋아요 테이블을 실시간 집계해 표시한다.
-- 되돌리기: 두 함수를 원래의 "IF NOT EXISTS THEN INSERT"(갱신 없음) 버전으로 복원.

-- ① 게시물/스토리 좋아요 (post_likes.target_type 으로 분기)
CREATE OR REPLACE FUNCTION public.notify_on_like()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_owner_id uuid; v_notif_type text;
BEGIN
  IF NEW.target_type = 'post' THEN
    SELECT user_id INTO v_owner_id FROM public.posts WHERE id = NEW.target_id;
    v_notif_type := 'post_like';
  ELSIF NEW.target_type = 'story' THEN
    SELECT user_id INTO v_owner_id FROM public.stories WHERE id = NEW.target_id;
    v_notif_type := 'story_like';
  ELSE RETURN NEW; END IF;

  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN RETURN NEW; END IF;

  UPDATE public.notifications
    SET created_at = now(), is_read = false
    WHERE user_id = v_owner_id AND type = v_notif_type
      AND reference_id = NEW.target_id AND reference_type = NEW.target_type;
  IF NOT FOUND THEN
    INSERT INTO public.notifications (user_id, type, reference_type, reference_id, message)
    VALUES (v_owner_id, v_notif_type, NEW.target_type, NEW.target_id, NULL);
  END IF;
  RETURN NEW;
END; $function$;

-- ② 댓글 좋아요
CREATE OR REPLACE FUNCTION public.notify_on_comment_like()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_owner_id uuid;
BEGIN
  SELECT user_id INTO v_owner_id FROM public.comments WHERE id = NEW.comment_id;
  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN RETURN NEW; END IF;

  UPDATE public.notifications
    SET created_at = now(), is_read = false
    WHERE user_id = v_owner_id AND type = 'comment_like'
      AND reference_id = NEW.comment_id AND reference_type = 'comment';
  IF NOT FOUND THEN
    INSERT INTO public.notifications (user_id, type, reference_type, reference_id, message)
    VALUES (v_owner_id, 'comment_like', 'comment', NEW.comment_id, NULL);
  END IF;
  RETURN NEW;
END; $function$;
