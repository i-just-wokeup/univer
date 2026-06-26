-- DM 푸시 스팸 방지: 이미 안 읽은 메시지가 있으면 추가 푸시 생략 (첫 안읽음만 푸시)
-- + collapseId(대화별) 추가. ※ Expo Push는 안드로이드 트레이 합치기를 보장하지 않음(알려진 한계).
CREATE OR REPLACE FUNCTION public.push_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient uuid;
  v_token text;
  v_sender_nickname text;
  v_body text;
BEGIN
  SELECT CASE WHEN participant_1_id = NEW.sender_id
              THEN participant_2_id ELSE participant_1_id END
  INTO v_recipient
  FROM public.conversations
  WHERE id = NEW.conversation_id;

  IF v_recipient IS NULL OR v_recipient = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  -- 이미 안 읽은 메시지가 있으면(이전에 푸시함) 생략
  IF EXISTS (
    SELECT 1 FROM public.messages
    WHERE conversation_id = NEW.conversation_id
      AND sender_id = NEW.sender_id
      AND read_at IS NULL
      AND deleted_at IS NULL
      AND id <> NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  SELECT fcm_token INTO v_token FROM public.users WHERE id = v_recipient;
  IF v_token IS NULL OR v_token NOT LIKE 'ExponentPushToken[%' THEN
    RETURN NEW;
  END IF;

  SELECT nickname INTO v_sender_nickname FROM public.users WHERE id = NEW.sender_id;
  v_body := COALESCE(v_sender_nickname, '상대방') || '님이 메시지를 보냈어요';

  PERFORM net.http_post(
    url     := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'to', v_token,
      'title', 'KREW',
      'body', v_body,
      'priority', 'high',
      'channelId', 'default',
      'collapseId', NEW.conversation_id::text,
      'data', jsonb_build_object('targetType', 'chat', 'conversationId', NEW.conversation_id)
    )
  );

  RETURN NEW;
END;
$$;
