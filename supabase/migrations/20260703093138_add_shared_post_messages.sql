-- DM으로 게시물을 공유할 수 있게 메시지에 연결 게시물 id를 저장한다.
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS shared_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_message_type_check;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text', 'image', 'system', 'post'));

CREATE INDEX IF NOT EXISTS messages_shared_post_id_idx
  ON public.messages(shared_post_id)
  WHERE shared_post_id IS NOT NULL;
