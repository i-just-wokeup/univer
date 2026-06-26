-- notifications type 제약에 comment_reply 허용 (없으면 트리거 INSERT가 막혀 댓글까지 롤백됨)
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY[
    'post_like','story_like','comment_like','post_comment','comment_reply',
    'user_like','friend_request','friend_accepted','report_received'
  ]));

-- 답글(대댓글) 알림 추가: 부모 댓글 작성자에게 'comment_reply' 알림
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner_id uuid;
  v_parent_author uuid;
BEGIN
  IF NEW.parent_id IS NULL THEN
    SELECT user_id INTO v_owner_id FROM public.posts WHERE id = NEW.post_id;
    IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN RETURN NEW; END IF;
    INSERT INTO public.notifications (user_id, type, reference_type, reference_id, message)
    VALUES (v_owner_id, 'post_comment', 'post', NEW.post_id, NULL);
  ELSE
    SELECT user_id INTO v_parent_author FROM public.comments WHERE id = NEW.parent_id;
    IF v_parent_author IS NULL OR v_parent_author = NEW.user_id THEN RETURN NEW; END IF;
    INSERT INTO public.notifications (user_id, type, reference_type, reference_id, message)
    VALUES (v_parent_author, 'comment_reply', 'post', NEW.post_id, NULL);
  END IF;
  RETURN NEW;
END;
$$;

-- 푸시 트리거에 comment_reply 추가 (post_comment + comment_reply 푸시)
CREATE OR REPLACE FUNCTION public.push_on_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_token text;
  v_body  text;
  v_data  jsonb;
BEGIN
  IF NEW.type = 'post_comment' THEN
    v_body := '회원님의 게시물에 새 댓글이 달렸어요';
  ELSIF NEW.type = 'comment_reply' THEN
    v_body := '회원님의 댓글에 답글이 달렸어요';
  ELSE
    RETURN NEW;
  END IF;

  SELECT fcm_token INTO v_token FROM public.users WHERE id = NEW.user_id;
  IF v_token IS NULL OR v_token NOT LIKE 'ExponentPushToken[%' THEN
    RETURN NEW;
  END IF;

  v_data := jsonb_build_object('targetType', 'post', 'targetId', NEW.reference_id);

  PERFORM net.http_post(
    url     := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'to', v_token,
      'title', 'KREW',
      'body', v_body,
      'priority', 'high',
      'channelId', 'default',
      'data', v_data
    )
  );

  RETURN NEW;
END;
$$;
