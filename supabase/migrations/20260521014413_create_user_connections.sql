-- user_connections 테이블: 크루(친구) 시스템
CREATE TABLE IF NOT EXISTS public.user_connections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, receiver_id)
);

ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_connections_select ON public.user_connections
  FOR SELECT USING (requester_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY user_connections_insert ON public.user_connections
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY user_connections_update ON public.user_connections
  FOR UPDATE USING (receiver_id = auth.uid());

CREATE POLICY user_connections_delete ON public.user_connections
  FOR DELETE USING (requester_id = auth.uid());

-- 크루 신청
CREATE OR REPLACE FUNCTION public.send_friend_request(target_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF v_uid = target_user_id THEN RAISE EXCEPTION '본인에게 신청할 수 없습니다.'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_connections
    WHERE (requester_id = v_uid AND receiver_id = target_user_id AND status = 'accepted')
    OR (requester_id = target_user_id AND receiver_id = v_uid AND status = 'accepted')
  ) THEN
    RAISE EXCEPTION '이미 친구입니다.';
  END IF;

  INSERT INTO public.user_connections (requester_id, receiver_id, status)
  VALUES (v_uid, target_user_id, 'pending')
  ON CONFLICT (requester_id, receiver_id) DO UPDATE SET status = 'pending', updated_at = now();

  RETURN json_build_object('success', true, 'status', 'pending');
END;
$$;

-- 크루 수락
CREATE OR REPLACE FUNCTION public.accept_friend_request(requester_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  UPDATE public.user_connections
  SET status = 'accepted', updated_at = now()
  WHERE requester_id = requester_user_id AND receiver_id = v_uid AND status = 'pending';

  IF NOT FOUND THEN RAISE EXCEPTION '신청을 찾을 수 없습니다.'; END IF;

  RETURN json_build_object('success', true, 'status', 'accepted');
END;
$$;

-- 크루 거절
CREATE OR REPLACE FUNCTION public.reject_friend_request(requester_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  UPDATE public.user_connections
  SET status = 'rejected', updated_at = now()
  WHERE requester_id = requester_user_id AND receiver_id = v_uid AND status = 'pending';

  IF NOT FOUND THEN RAISE EXCEPTION '신청을 찾을 수 없습니다.'; END IF;

  RETURN json_build_object('success', true, 'status', 'rejected');
END;
$$;

-- 크루 삭제
CREATE OR REPLACE FUNCTION public.remove_friend(target_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  DELETE FROM public.user_connections
  WHERE (requester_id = v_uid AND receiver_id = target_user_id)
  OR (requester_id = target_user_id AND receiver_id = v_uid);

  RETURN json_build_object('success', true);
END;
$$;

-- 연결 상태 조회
CREATE OR REPLACE FUNCTION public.get_connection_status(target_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_conn record;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO v_conn FROM public.user_connections
  WHERE (requester_id = v_uid AND receiver_id = target_user_id)
  OR (requester_id = target_user_id AND receiver_id = v_uid)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('status', 'none', 'is_requester', false, 'friends_count',
      (SELECT COUNT(*) FROM public.user_connections
       WHERE (requester_id = target_user_id OR receiver_id = target_user_id)
       AND status = 'accepted'));
  END IF;

  RETURN json_build_object(
    'status', v_conn.status,
    'is_requester', v_conn.requester_id = v_uid,
    'friends_count', (SELECT COUNT(*) FROM public.user_connections
      WHERE (requester_id = target_user_id OR receiver_id = target_user_id)
      AND status = 'accepted')
  );
END;
$$;

-- 받은 크루 신청 목록
CREATE OR REPLACE FUNCTION public.get_pending_requests()
RETURNS TABLE (id uuid, nickname text, avatar_url text, department text, created_at timestamptz)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT requester.id, requester.nickname, requester.avatar_url, requester.department, user_connections.created_at
  FROM user_connections
  JOIN users AS requester ON requester.id = user_connections.requester_id
  WHERE user_connections.receiver_id = auth.uid() AND user_connections.status = 'pending'
  ORDER BY user_connections.created_at DESC;
$$;

-- 보낸 크루 신청 목록
CREATE OR REPLACE FUNCTION public.get_sent_requests()
RETURNS TABLE (id uuid, nickname text, avatar_url text, department text, created_at timestamptz)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT receiver.id, receiver.nickname, receiver.avatar_url, receiver.department, user_connections.created_at
  FROM user_connections
  JOIN users AS receiver ON receiver.id = user_connections.receiver_id
  WHERE user_connections.requester_id = auth.uid() AND user_connections.status = 'pending'
  ORDER BY user_connections.created_at DESC;
$$;
