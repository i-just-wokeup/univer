# DATABASE

Supabase Postgres 기준. 모든 테이블 RLS 적용.

> ⚠️ 스키마 변경 시 이 문서 반드시 업데이트. 노션 DB 스키마 페이지와 동기화 유지.

## 확정된 원칙
- 인증: `auth.users` / 서비스 프로필: `public.users`
- 시간: UTC 저장, KST 출력
- soft delete: `deleted_at` 패턴
- 이미지: Supabase Storage 저장, DB에는 URL만
- 학번 수집 안 함 (개인정보)
- 대댓글 1단계만, 삭제 시 cascade
- 뮤트 기능 없음
- 게시물/스토리 공개범위: 'public' | 'close_friends'
- 친한친구는 일방적 (상대방 모름)
- 해시태그/피드 같은 학교 기준

---

## 개발 단계별 테이블 (총 24개)

### 1단계 MVP — 18개

**universities**
```sql
universities (
  id          uuid PK default gen_random_uuid(),
  name        text not null,
  domain      text not null unique,   -- kookmin.ac.kr
  is_active   bool default false,
  created_at  timestamptz default now()
)
```

**users** (RLS 활성화, 민감 컬럼 BEFORE UPDATE 트리거 보호)
```sql
users (
  id            uuid PK references auth.users,
  email         text,
  real_name     text,
  nickname      text not null,
  bio           text,
  avatar_url    text,
  university_id uuid FK → universities not null,
  department    text not null,
  credit_balance int default 0,
  level         int default 1,
  level_score   int default 0,
  role          text default 'user',          -- 'user' | 'official' | 'admin'
  is_onboarded  bool default false,
  is_active     bool default true,
  fcm_token     text,
  visibility    text default 'public',        -- 'public' | 'close_friends'
  deleted_at    timestamptz,
  created_at    timestamptz default now()
)
-- 트리거 보호 컬럼 (auth.uid() 있을 때): role, university_id, is_active, email, real_name,
--   credit_balance, level, level_score, created_at, is_onboarded(true→false 불가)
```

**profile_links**
```sql
profile_links (
  id          uuid PK default gen_random_uuid(),
  user_id     uuid FK → users on delete cascade,
  label       text not null,                  -- 표시명: instagram.com 등
  url         text not null,                  -- http/https 링크만 허용
  order_index int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
)
```

**posts**
```sql
posts (
  id             uuid PK default gen_random_uuid(),
  user_id        uuid FK → users,
  content        text,
  views_count    int default 0,
  likes_count    int default 0,
  comments_count int default 0,
  university_id  uuid FK → universities not null,
  visibility     text default 'public',       -- 'public' | 'close_friends'
  deleted_at     timestamptz,
  created_at     timestamptz default now()
)
```

**post_media**
```sql
post_media (
  id            uuid PK default gen_random_uuid(),
  post_id       uuid FK → posts on delete cascade,
  type          text not null default 'image', -- 'image' | 'video'
  url           text not null,
  thumbnail_url text,
  duration      int,
  order_index   int default 0,
  created_at    timestamptz default now()
)
```

**stories**
```sql
stories (
  id            uuid PK default gen_random_uuid(),
  user_id       uuid FK → users,
  image_url     text not null,
  university_id uuid FK → universities not null,
  views_count   int default 0,
  expires_at    timestamptz not null,         -- 생성 후 24시간 (피드에서 안 보임)
  is_archived   bool default false,           -- 보관함에서 확인 가능
  visibility    text default 'public',        -- 'public' | 'close_friends'
  deleted_at    timestamptz,                  -- 본인 직접 삭제
  created_at    timestamptz default now()
)
```

**story_views**
```sql
story_views (
  id         uuid PK default gen_random_uuid(),
  story_id   uuid FK → stories on delete cascade,
  user_id    uuid FK → users,
  created_at timestamptz default now(),
  UNIQUE(story_id, user_id)
)
```

**post_likes** (게시물 + 스토리 통합)
```sql
post_likes (
  id          uuid PK default gen_random_uuid(),
  user_id     uuid FK → users,
  target_type text not null,                  -- 'post' | 'story'
  target_id   uuid not null,
  created_at  timestamptz default now(),
  UNIQUE(user_id, target_type, target_id)
)
```

**comments**
```sql
comments (
  id         uuid PK default gen_random_uuid(),
  user_id    uuid FK → users,
  post_id    uuid FK → posts on delete cascade,
  parent_id  uuid FK → comments on delete cascade,  -- 대댓글 1단계만
  content    text not null,
  deleted_at timestamptz,
  created_at timestamptz default now()
)
```

**comment_likes**
```sql
comment_likes (
  id         uuid PK default gen_random_uuid(),
  user_id    uuid FK → users,
  comment_id uuid FK → comments on delete cascade,
  created_at timestamptz default now(),
  UNIQUE(user_id, comment_id)
)
```

**user_connections** (친구 신청/수락)
```sql
user_connections (
  id           uuid PK default gen_random_uuid(),
  requester_id uuid FK → users,
  receiver_id  uuid FK → users,
  status       text not null default 'pending', -- 'pending' | 'accepted' | 'rejected'
  created_at   timestamptz default now(),
  UNIQUE(requester_id, receiver_id)
)
```

**close_friends** (친한친구 — 일방적)
```sql
close_friends (
  id         uuid PK default gen_random_uuid(),
  user_id    uuid FK → users,
  friend_id  uuid FK → users,
  created_at timestamptz default now(),
  UNIQUE(user_id, friend_id)
)
```

**hashtags**
```sql
hashtags (
  id         uuid PK default gen_random_uuid(),
  name       text unique not null,
  created_at timestamptz default now()
)
```

**post_hashtags**
```sql
post_hashtags (
  post_id    uuid FK → posts on delete cascade,
  hashtag_id uuid FK → hashtags on delete cascade,
  PRIMARY KEY(post_id, hashtag_id)
)
```

**bookmarks** (게시물만)
```sql
bookmarks (
  id         uuid PK default gen_random_uuid(),
  user_id    uuid FK → users,
  post_id    uuid FK → posts on delete cascade,
  created_at timestamptz default now(),
  UNIQUE(user_id, post_id)
)
```

**notifications**
```sql
notifications (
  id             uuid PK default gen_random_uuid(),
  user_id        uuid FK → users,
  type           text not null,
  reference_type text,                        -- 'post' | 'user' | 'comment' | 'story'
  reference_id   uuid,
  message        text,
  is_read        bool default false,
  created_at     timestamptz default now()
)
-- type 종류:
-- post_like      내 게시물 좋아요
-- story_like     내 스토리 좋아요
-- comment_like   내 댓글 좋아요
-- post_comment   내 게시물 댓글
-- friend_request 친구 신청
-- friend_accepted 친구 신청 수락
-- report_received 신고 접수
```

**blocks**
```sql
blocks (
  id         uuid PK default gen_random_uuid(),
  blocker_id uuid FK → users,
  blocked_id uuid FK → users,
  created_at timestamptz default now(),
  UNIQUE(blocker_id, blocked_id)
)
```

**reports**
```sql
reports (
  id          uuid PK default gen_random_uuid(),
  reporter_id uuid FK → users,
  target_type text not null,   -- 'post' | 'story' | 'user'
  target_id   uuid not null,
  target_author_id uuid FK → users on delete set null,
  target_snapshot jsonb,
  reason      text,
  status      text default 'pending',
  -- 'pending' | 'reviewed' | 'dismissed' | 'action_taken'
  created_at  timestamptz default now(),
  UNIQUE(reporter_id, target_type, target_id)
)
```

**RPC**
```sql
search_users(search_query text)
delete_account()
restore_account()
send_friend_request(target_user_id uuid)
accept_friend_request(target_user_id uuid)
reject_friend_request(target_user_id uuid)
remove_friend(target_user_id uuid)
get_connection_status(target_user_id uuid)
get_friends()
get_pending_requests()
get_sent_requests()
-- admin
ban_user(target_user_id uuid)
unban_user(target_user_id uuid)
update_user_role(target_user_id uuid, new_role text)
dismiss_report(report_id uuid)
take_action_on_report(report_id uuid)
```

**계정 탈퇴/복구 정책**
- `delete_account()`
  - `users.deleted_at = now()`, `fcm_token = null`
  - 작성 콘텐츠는 hard delete하지 않고 soft delete:
    - `posts.deleted_at`
    - `stories.deleted_at`
    - `comments.deleted_at`
    - `messages.deleted_at`
  - 복구해도 의미가 작거나 개인 상태에 가까운 데이터는 삭제:
    - 알림, 북마크, 스토리 조회 기록, 친한친구, 차단, 유저 좋아요, 댓글 좋아요, 게시물/스토리 좋아요
- `restore_account()`
  - 30일 내 복구 가능
  - 계정 탈퇴 시각과 같은 `deleted_at`을 가진 작성 콘텐츠만 복구
  - 탈퇴 전 사용자가 직접 삭제한 콘텐츠는 복구하지 않음

---

### 2단계 — 채팅 2개

**conversations**
```sql
conversations (
  id                   uuid PK default gen_random_uuid(),
  participant_1_id     uuid FK → users,
  participant_2_id     uuid FK → users,
  status               text default 'pending', -- 'pending' | 'active'
  initiated_by         uuid FK → users,
  last_message_at      timestamptz,
  last_message_preview text,
  hidden_at_1          timestamptz,
  hidden_at_2          timestamptz,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now(),
  UNIQUE(participant_1_id, participant_2_id)
)
```

**messages**
```sql
messages (
  id              uuid PK default gen_random_uuid(),
  conversation_id uuid FK → conversations on delete cascade,
  sender_id       uuid FK → users,
  message_type    text default 'text', -- 'text' | 'image' | 'system'
  content         text not null,
  read_at         timestamptz,
  deleted_at      timestamptz,
  created_at      timestamptz default now()
)
```

**RPC**
```sql
mark_messages_read(p_conversation_id uuid)
accept_chat_request(p_conversation_id uuid)
get_or_create_conversation(other_user_id uuid)
```

**Realtime**
- `messages`, `conversations`는 `supabase_realtime` publication에 등록
- 메시지 수신은 `messages` INSERT + `conversation_id` filter로 구독
- 대화 목록/뱃지는 `conversations` UPDATE 구독으로 갱신

---

### 3단계 — 커뮤니티 2개

**community_posts**
```sql
community_posts (
  id             uuid PK default gen_random_uuid(),
  user_id        uuid FK → users,
  university_id  uuid FK → universities not null,
  title          text not null,
  content        text not null,
  category       text not null,   -- [미확정] 종류 추후 결정
  is_anonymous   bool default false,
  views_count    int default 0,
  likes_count    int default 0,
  comments_count int default 0,
  deleted_at     timestamptz,
  created_at     timestamptz default now()
)
```

**community_comments**
```sql
community_comments (
  id         uuid PK default gen_random_uuid(),
  user_id    uuid FK → users,
  post_id    uuid FK → community_posts on delete cascade,
  parent_id  uuid FK → community_comments on delete cascade,
  content    text not null,
  deleted_at timestamptz,
  created_at timestamptz default now()
)
```

---

## RLS 정책 요약

| 테이블 | 읽기 | 쓰기 |
|---|---|---|
| universities | 전체 공개 | 관리자만 |
| users | 같은 학교 유저 | 본인만 |
| profile_links | 로그인 유저 | 본인만 |
| posts | 같은 학교 + visibility 체크 | 본인만 |
| post_media | 같은 학교 유저 | 본인만 |
| stories | 같은 학교 + visibility 체크 | 본인만 |
| story_views | 본인만 | 로그인 유저 |
| post_likes | 공개 | 로그인 유저 |
| comment_likes | 공개 | 로그인 유저 |
| user_connections | 공개 | 로그인 유저 |
| close_friends | 본인만 | 본인만 |
| comments | 같은 학교 유저 | 본인만 |
| bookmarks | 본인만 | 본인만 |
| notifications | 본인만 | 시스템 |
| blocks | 본인만 | 본인만 |
| reports | 본인만 | 로그인 유저 |
| conversations | 참여자만 | 로그인 유저 |
| messages | 참여자만 | 참여자만 |
| community_posts | 같은 학교 유저 | 본인만 |
| community_comments | 같은 학교 유저 | 본인만 |
