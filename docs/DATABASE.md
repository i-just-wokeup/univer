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

## 개발 단계별 테이블 (총 23개)

### 1단계 MVP — 17개

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

**users**
```sql
users (
  id            uuid PK references auth.users,
  email         text,
  nickname      text not null,
  avatar_url    text,
  university_id uuid FK → universities not null,
  department    text not null,
  role          text default 'user',          -- 'user' | 'official'
  is_onboarded  bool default false,
  is_active     bool default true,
  fcm_token     text,
  visibility    text default 'public',        -- 'public' | 'close_friends'
  deleted_at    timestamptz,
  created_at    timestamptz default now()
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

**post_images**
```sql
post_images (
  id          uuid PK default gen_random_uuid(),
  post_id     uuid FK → posts on delete cascade,
  url         text not null,
  order_index int default 0,
  created_at  timestamptz default now()
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

**user_likes** (팔로우 대체)
```sql
user_likes (
  id           uuid PK default gen_random_uuid(),
  from_user_id uuid FK → users,
  to_user_id   uuid FK → users,
  notify       bool default false,            -- 새 게시물 알림 수신 여부
  created_at   timestamptz default now(),
  UNIQUE(from_user_id, to_user_id)
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
  reference_type text,                        -- 'post' | 'user' | 'comment'
  reference_id   uuid,
  message        text,
  is_read        bool default false,
  created_at     timestamptz default now()
)
-- type 종류:
-- post_like      내 게시물 좋아요
-- post_comment   내 게시물 댓글
-- comment_reply  내 댓글에 대댓글
-- user_like      나를 유저 좋아요
-- new_post       좋아요한 계정 새 게시물 (notify=true만)
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
  target_type text not null,   -- 'post' | 'comment' | 'story' | 'user'
  target_id   uuid not null,
  reason      text not null,   -- 선택지 고정 (스팸, 욕설, 음란물 등)
  status      text default 'pending',
  -- 'pending' | 'reviewed' | 'dismissed' | 'action_taken'
  created_at  timestamptz default now()
)
```

---

### 2단계 — 채팅 4개

**chat_rooms**
```sql
chat_rooms (
  id         uuid PK default gen_random_uuid(),
  type       text not null,   -- 'direct' | 'group'
  name       text,            -- 단체채팅방만
  created_at timestamptz default now()
)
```

**chat_room_members**
```sql
chat_room_members (
  id        uuid PK default gen_random_uuid(),
  room_id   uuid FK → chat_rooms on delete cascade,
  user_id   uuid FK → users,
  joined_at timestamptz default now(),
  UNIQUE(room_id, user_id)
)
```

**messages**
```sql
messages (
  id         uuid PK default gen_random_uuid(),
  room_id    uuid FK → chat_rooms on delete cascade,
  user_id    uuid FK → users,
  content    text not null,
  deleted_at timestamptz,
  created_at timestamptz default now()
)
```

**message_reads**
```sql
message_reads (
  id         uuid PK default gen_random_uuid(),
  message_id uuid FK → messages on delete cascade,
  user_id    uuid FK → users,
  read_at    timestamptz default now(),
  UNIQUE(message_id, user_id)
)
```

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
| posts | 같은 학교 + visibility 체크 | 본인만 |
| post_images | 같은 학교 유저 | 본인만 |
| stories | 같은 학교 + visibility 체크 | 본인만 |
| story_views | 본인만 | 로그인 유저 |
| post_likes | 공개 | 로그인 유저 |
| comment_likes | 공개 | 로그인 유저 |
| user_likes | 공개 | 로그인 유저 |
| close_friends | 본인만 | 본인만 |
| comments | 같은 학교 유저 | 본인만 |
| bookmarks | 본인만 | 본인만 |
| notifications | 본인만 | 시스템 |
| blocks | 본인만 | 본인만 |
| reports | 본인만 | 로그인 유저 |
| chat_rooms | 참여자만 | 로그인 유저 |
| messages | 참여자만 | 참여자만 |
| message_reads | 본인만 | 본인만 |
| community_posts | 같은 학교 유저 | 본인만 |
| community_comments | 같은 학교 유저 | 본인만 |
