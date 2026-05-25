CREATE OR REPLACE FUNCTION get_friends()
RETURNS TABLE (
  id uuid,
  nickname text,
  avatar_url text,
  department text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    friend_user.id,
    friend_user.nickname,
    friend_user.avatar_url,
    friend_user.department
  FROM user_connections
  JOIN users AS friend_user
    ON friend_user.id = CASE
      WHEN user_connections.requester_id = auth.uid()
        THEN user_connections.receiver_id
      ELSE user_connections.requester_id
    END
  WHERE user_connections.status = 'accepted'
    AND (
      user_connections.requester_id = auth.uid()
      OR user_connections.receiver_id = auth.uid()
    )
  ORDER BY user_connections.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION get_pending_requests()
RETURNS TABLE (
  id uuid,
  nickname text,
  avatar_url text,
  department text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    requester.id,
    requester.nickname,
    requester.avatar_url,
    requester.department,
    user_connections.created_at
  FROM user_connections
  JOIN users AS requester
    ON requester.id = user_connections.requester_id
  WHERE user_connections.receiver_id = auth.uid()
    AND user_connections.status = 'pending'
  ORDER BY user_connections.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION get_sent_requests()
RETURNS TABLE (
  id uuid,
  nickname text,
  avatar_url text,
  department text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    receiver.id,
    receiver.nickname,
    receiver.avatar_url,
    receiver.department,
    user_connections.created_at
  FROM user_connections
  JOIN users AS receiver
    ON receiver.id = user_connections.receiver_id
  WHERE user_connections.requester_id = auth.uid()
    AND user_connections.status = 'pending'
  ORDER BY user_connections.created_at DESC;
$$;
