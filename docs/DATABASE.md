# DATABASE

Supabase Postgres 기준. 모든 테이블 RLS 적용.

> ⚠️ 스키마 변경 시 이 문서 반드시 업데이트

## 핵심 원칙
- 인증 정보: `auth.users` / 서비스 프로필: `public.users`
- 시간 저장: UTC / 화면 출력: KST 변환
- soft delete: `deleted_at` 패턴
- 이미지: Supabase Storage에 저장, DB에는 URL만

---

## users
```sql
users (
  id           uuid references auth.users primary key,
  email        text,
  nickname     text not null,
  avatar_url   text,
  university   text not null,    -- 학교명
  department   text not null,    -- 학과
  student_id   text,             -- 학번 (선택)
  role         text default 'user',
  is_active    bool default true,
  created_at   timestamptz default now()
)
```

## posts
```sql
posts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references users(id),
  content        text,
  image_urls     text[],          -- Supabase Storage URL 배열
  likes_count    int default 0,
  comments_count int default 0,
  university     text not null,   -- 학교별 피드 분리
  deleted_at     timestamptz,
  created_at     timestamptz default now()
)
```

## stories
```sql
stories (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id),
  image_url    text not null,
  university   text not null,
  expires_at   timestamptz not null,  -- 생성 후 24시간
  created_at   timestamptz default now()
)
```

## likes (게시물/댓글 좋아요)
```sql
likes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id),
  target_type  text not null,    -- 'post' | 'comment'
  target_id    uuid not null,
  created_at   timestamptz default now(),
  unique(user_id, target_type, target_id)
)
```

## user_likes (유저 좋아요 — 팔로우 대체)
```sql
user_likes (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid references users(id),
  to_user_id   uuid references users(id),
  created_at   timestamptz default now(),
  unique(from_user_id, to_user_id)
)
```

## comments
```sql
comments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id),
  post_id      uuid references posts(id),
  parent_id    uuid references comments(id),  -- 대댓글
  content      text not null,
  deleted_at   timestamptz,
  created_at   timestamptz default now()
)
```

## hashtags / post_hashtags
```sql
hashtags (
  id    uuid primary key default gen_random_uuid(),
  name  text unique not null
)

post_hashtags (
  post_id    uuid references posts(id),
  hashtag_id uuid references hashtags(id),
  primary key (post_id, hashtag_id)
)
```

## notifications
```sql
notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id),
  type         text not null,    -- 'like' | 'comment' | 'user_like'
  reference_id uuid,
  message      text,
  is_read      bool default false,
  created_at   timestamptz default now()
)
```

---

## RLS 정책 요약
| 테이블 | 읽기 | 쓰기 |
|---|---|---|
| users | 같은 학교 유저 | 본인만 |
| posts | 같은 학교 유저 | 본인만 |
| stories | 같은 학교 유저 | 본인만 |
| likes | 공개 | 로그인 유저 |
| user_likes | 공개 | 로그인 유저 |
| comments | 같은 학교 유저 | 본인만 |
| notifications | 본인만 | 시스템 |
