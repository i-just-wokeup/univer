-- 알림 트리거 함수들

-- 좋아요 알림 (최초 1회)
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner_id uuid;
  v_notif_type text;
BEGIN
  IF NEW.target_type = 'post' THEN
    SELECT user_id INTO v_owner_id FROM public.posts WHERE id = NEW.target_id;
    v_notif_type := 'post_like';
  ELSIF NEW.target_type = 'story' THEN
    SELECT user_id INTO v_owner_id FROM public.stories WHERE id = NEW.target_id;
    v_notif_type := 'story_like';
  ELSE
    RETURN NEW;
  END IF;

  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN RETURN NEW; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = v_owner_id AND type = v_notif_type
      AND reference_id = NEW.target_id AND reference_type = NEW.target_type
  ) THEN
    INSERT INTO public.notifications (user_id, type, reference_type, reference_id, message)
    VALUES (v_owner_id, v_notif_type, NEW.target_type, NEW.target_id, NULL);
  END IF;

  RETURN NEW;
END;
$$;

-- 댓글 좋아요 알림 (최초 1회)
CREATE OR REPLACE FUNCTION public.notify_on_comment_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner_id uuid;
BEGIN
  SELECT user_id INTO v_owner_id FROM public.comments WHERE id = NEW.comment_id;
  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN RETURN NEW; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = v_owner_id AND type = 'comment_like'
      AND reference_id = NEW.comment_id AND reference_type = 'comment'
  ) THEN
    INSERT INTO public.notifications (user_id, type, reference_type, reference_id, message)
    VALUES (v_owner_id, 'comment_like', 'comment', NEW.comment_id, NULL);
  END IF;

  RETURN NEW;
END;
$$;

-- 댓글 알림 (대댓글 제외)
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner_id uuid;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN RETURN NEW; END IF;

  SELECT user_id INTO v_owner_id FROM public.posts WHERE id = NEW.post_id;
  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, type, reference_type, reference_id, message)
  VALUES (v_owner_id, 'post_comment', 'post', NEW.post_id, NULL);

  RETURN NEW;
END;
$$;

-- 신고 알림 (관리자 전체)
CREATE OR REPLACE FUNCTION public.notify_on_report()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, reference_type, reference_id, message)
  SELECT id, 'report_received', NEW.target_type, NEW.target_id, NULL
  FROM public.users WHERE role = 'admin';
  RETURN NEW;
END;
$$;

-- 크루 신청/수락 알림
CREATE OR REPLACE FUNCTION public.notify_on_friend_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'pending' AND (TG_OP = 'INSERT' OR OLD.status = 'rejected') THEN
    INSERT INTO public.notifications (user_id, type, reference_type, reference_id, message)
    VALUES (NEW.receiver_id, 'friend_request', 'user', NEW.requester_id, NULL);
  ELSIF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, reference_type, reference_id, message)
    VALUES (NEW.requester_id, 'friend_accepted', 'user', NEW.receiver_id, NULL);
  END IF;
  RETURN NEW;
END;
$$;

-- 신고 스냅샷 저장 트리거 함수
CREATE OR REPLACE FUNCTION public.fill_report_snapshot()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.target_type = 'post' THEN
    SELECT
      jsonb_build_object('content', p.content, 'thumbnail_url',
        (SELECT pm.url FROM public.post_media pm WHERE pm.post_id = p.id ORDER BY pm.order_index ASC LIMIT 1)),
      p.user_id
    INTO NEW.target_snapshot, NEW.target_author_id
    FROM public.posts p WHERE p.id = NEW.target_id;
  ELSIF NEW.target_type = 'story' THEN
    SELECT
      jsonb_build_object('content', NULL, 'thumbnail_url', s.image_url),
      s.user_id
    INTO NEW.target_snapshot, NEW.target_author_id
    FROM public.stories s WHERE s.id = NEW.target_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 신고 target_author_id 자동 채우기
CREATE OR REPLACE FUNCTION public.fill_report_target_author()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.target_type = 'post' THEN
    SELECT user_id INTO NEW.target_author_id FROM public.posts WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'story' THEN
    SELECT user_id INTO NEW.target_author_id FROM public.stories WHERE id = NEW.target_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 트리거 연결
CREATE OR REPLACE TRIGGER trg_notify_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

CREATE OR REPLACE TRIGGER trg_notify_comment_like
  AFTER INSERT ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment_like();

CREATE OR REPLACE TRIGGER trg_notify_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

CREATE OR REPLACE TRIGGER trg_notify_report
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_report();

CREATE OR REPLACE TRIGGER trg_notify_friend_request
  AFTER INSERT OR UPDATE ON public.user_connections
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_friend_request();

CREATE OR REPLACE TRIGGER trg_fill_report_snapshot
  BEFORE INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.fill_report_snapshot();
