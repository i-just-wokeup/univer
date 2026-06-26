-- pg_net (트리거에서 외부 HTTP 호출용)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- notifications insert 시 Expo Push로 푸시 전송 (1차 범위: 댓글만, 추후 타입 확장)
CREATE OR REPLACE FUNCTION public.push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
  v_body  text;
  v_data  jsonb;
BEGIN
  IF NEW.type <> 'post_comment' THEN
    RETURN NEW;
  END IF;

  SELECT fcm_token INTO v_token FROM public.users WHERE id = NEW.user_id;
  IF v_token IS NULL OR v_token NOT LIKE 'ExponentPushToken[%' THEN
    RETURN NEW;
  END IF;

  v_body := '회원님의 게시물에 새 댓글이 달렸어요';
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

CREATE OR REPLACE TRIGGER trg_push_on_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.push_on_notification();
