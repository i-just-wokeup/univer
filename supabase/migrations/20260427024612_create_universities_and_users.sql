-- ================================
-- universities
-- ================================
CREATE TABLE universities (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  domain     text NOT NULL UNIQUE,
  is_active  bool NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 국민대학교 초기 데이터
INSERT INTO universities (name, domain, is_active)
VALUES ('국민대학교', 'kookmin.ac.kr', true);

-- ================================
-- users
-- ================================
CREATE TABLE users (
  id            uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email         text,
  nickname      text NOT NULL,
  avatar_url    text,
  university_id uuid NOT NULL REFERENCES universities(id),
  department    text NOT NULL,
  role          text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'official')),
  is_onboarded  bool NOT NULL DEFAULT false,
  is_active     bool NOT NULL DEFAULT true,
  fcm_token     text,
  visibility    text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'close_friends')),
  deleted_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 신규 유저 자동 생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname, university_id, department)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    (SELECT id FROM universities WHERE is_active = true LIMIT 1),
    ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "universities_public_read" ON universities
  FOR SELECT USING (true);

CREATE POLICY "users_read_same_university" ON users
  FOR SELECT USING (
    university_id = (SELECT university_id FROM users WHERE id = auth.uid())
    AND deleted_at IS NULL
  );

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (id = auth.uid());
