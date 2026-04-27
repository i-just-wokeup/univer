-- ================================
-- notifications
-- ================================
CREATE TABLE notifications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type           text NOT NULL CHECK (type IN ('post_like', 'post_comment', 'comment_reply', 'user_like', 'new_post')),
  reference_type text CHECK (reference_type IN ('post', 'user', 'comment', 'story')),
  reference_id   uuid,
  message        text,
  is_read        bool NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ================================
-- blocks
-- ================================
CREATE TABLE blocks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- ================================
-- reports
-- ================================
CREATE TABLE reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('post', 'comment', 'story', 'user')),
  target_id   uuid NOT NULL,
  reason      text NOT NULL CHECK (reason IN ('spam', 'abuse', 'obscene', 'false_info', 'other')),
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_read_own" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "blocks_read_own" ON blocks FOR SELECT USING (blocker_id = auth.uid());
CREATE POLICY "blocks_insert" ON blocks FOR INSERT WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "blocks_delete" ON blocks FOR DELETE USING (blocker_id = auth.uid());

CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports_read_own" ON reports FOR SELECT USING (reporter_id = auth.uid());
