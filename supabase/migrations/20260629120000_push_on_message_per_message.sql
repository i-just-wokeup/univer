-- DM 푸시: 메시지마다 개별 알림. 제목=보낸 사람 닉네임, 본문=메시지 내용 미리보기.
-- 이전(content_preview)의 "첫 안읽음만 푸시" 생략 + collapseId(대화방 단위 교체)를 제거 →
-- 메시지마다 알림이 따로 뜬다(아이폰은 앱 단위 자동 묶임, 안드는 따로 쌓임).
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
  v_title text;
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

  SELECT fcm_token INTO v_token FROM public.users WHERE id = v_recipient;
  IF v_token IS NULL OR v_token NOT LIKE 'ExponentPushToken[%' THEN
    RETURN NEW;
  END IF;

  SELECT nickname INTO v_sender_nickname FROM public.users WHERE id = NEW.sender_id;
  v_title := COALESCE(v_sender_nickname, 'KREW');
  v_body := CASE
    WHEN NEW.content IS NOT NULL AND length(trim(NEW.content)) > 0
      THEN left(NEW.content, 120)
    ELSE '메시지를 보냈어요'
  END;

  PERFORM net.http_post(
    url     := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'to', v_token,
      'title', v_title,
      'body', v_body,
      'priority', 'high',
      'channelId', 'default',
      'data', jsonb_build_object('targetType', 'chat', 'conversationId', NEW.conversation_id)
    )
  );

  RETURN NEW;
END;
$$;
