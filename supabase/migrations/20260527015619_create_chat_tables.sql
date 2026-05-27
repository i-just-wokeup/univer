-- 채팅 테이블: conversations + messages

CREATE TABLE IF NOT EXISTS public.conversations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant_2_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status                text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  initiated_by          uuid NOT NULL REFERENCES public.users(id),
  last_message_at       timestamptz,
  last_message_preview  text,
  last_message_sender_id uuid REFERENCES public.users(id),
  hidden_at_1           timestamptz,
  hidden_at_2           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_type    text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image')),
  content         text NOT NULL,
  read_at         timestamptz,
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversations_select ON public.conversations
  FOR SELECT USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY conversations_insert ON public.conversations
  FOR INSERT WITH CHECK (
    initiated_by = auth.uid()
    AND (auth.uid() = participant_1_id OR auth.uid() = participant_2_id)
  );

CREATE POLICY messages_select ON public.messages
  FOR SELECT USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
        AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
    )
  );

CREATE POLICY messages_insert ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
        AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
    )
  );

-- 메시지 전송 시 대화방 마지막 메시지 업데이트
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 30),
    last_message_sender_id = NEW.sender_id
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_on_message();

-- 크루 수락 시 pending 대화방 자동 active 전환
CREATE OR REPLACE FUNCTION public.handle_friend_accepted_chat()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p1 uuid; p2 uuid;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    p1 := LEAST(NEW.requester_id, NEW.receiver_id);
    p2 := GREATEST(NEW.requester_id, NEW.receiver_id);
    UPDATE public.conversations
    SET status = 'active'
    WHERE participant_1_id = p1 AND participant_2_id = p2 AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_friend_accepted_chat
  AFTER UPDATE ON public.user_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_friend_accepted_chat();

-- 채팅 요청 수락 RPC
CREATE OR REPLACE FUNCTION public.accept_chat_request(p_conversation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = p_conversation_id
      AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
      AND initiated_by != auth.uid()
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  UPDATE public.conversations SET status = 'active' WHERE id = p_conversation_id;
END;
$$;

-- 메시지 읽음 처리 RPC
CREATE OR REPLACE FUNCTION public.mark_messages_read(p_conversation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = p_conversation_id
      AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  UPDATE public.messages
  SET read_at = now()
  WHERE conversation_id = p_conversation_id
    AND sender_id != auth.uid()
    AND read_at IS NULL
    AND deleted_at IS NULL;
END;
$$;
