-- 안드로이드 포그라운드 heads-up 알림 수정.
-- 기존 "default" 채널이 낮은 중요도로 굳어(안드로이드는 채널 중요도 변경 불가) 앱 켜져있을 때
-- 배너가 안 떴다. 클라(push.ts)는 새 채널 id "alerts"(HIGH)로 재생성하고,
-- 서버 푸시도 channelId를 'default' → 'alerts'로 바꾼다. 겸사겸사 제목 'KREW' → 'unip'.

CREATE OR REPLACE FUNCTION public.push_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_recipient uuid; v_token text; v_sender_nickname text; v_title text; v_body text;
BEGIN
  SELECT CASE WHEN participant_1_id = NEW.sender_id
              THEN participant_2_id ELSE participant_1_id END
  INTO v_recipient FROM public.conversations WHERE id = NEW.conversation_id;

  IF v_recipient IS NULL OR v_recipient = NEW.sender_id THEN RETURN NEW; END IF;

  SELECT fcm_token INTO v_token FROM public.users WHERE id = v_recipient;
  IF v_token IS NULL OR v_token NOT LIKE 'ExponentPushToken[%' THEN RETURN NEW; END IF;

  SELECT nickname INTO v_sender_nickname FROM public.users WHERE id = NEW.sender_id;
  v_title := COALESCE(v_sender_nickname, 'unip');
  v_body := CASE
    WHEN NEW.content IS NOT NULL AND length(trim(NEW.content)) > 0 THEN left(NEW.content, 120)
    ELSE '메시지를 보냈어요' END;

  PERFORM net.http_post(
    url     := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'to', v_token, 'title', v_title, 'body', v_body,
      'priority', 'high', 'channelId', 'alerts',
      'data', jsonb_build_object('targetType', 'chat', 'conversationId', NEW.conversation_id)
    )
  );
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.push_on_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_token text; v_body text; v_data jsonb;
BEGIN
  IF NEW.type = 'post_comment' THEN
    v_body := '회원님의 게시물에 새 댓글이 달렸어요';
  ELSIF NEW.type = 'comment_reply' THEN
    v_body := '회원님의 댓글에 답글이 달렸어요';
  ELSE RETURN NEW; END IF;

  SELECT fcm_token INTO v_token FROM public.users WHERE id = NEW.user_id;
  IF v_token IS NULL OR v_token NOT LIKE 'ExponentPushToken[%' THEN RETURN NEW; END IF;

  v_data := jsonb_build_object('targetType', 'post', 'targetId', NEW.reference_id);

  PERFORM net.http_post(
    url     := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'to', v_token, 'title', 'unip', 'body', v_body,
      'priority', 'high', 'channelId', 'alerts', 'data', v_data
    )
  );
  RETURN NEW;
END; $$;
