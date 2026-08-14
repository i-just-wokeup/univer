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

## 개발 단계별 테이블

> **DB 실존(2026-07-19 검증)**: 1·2단계 + 지표 + `follows` + `close_friends` = 23개 도메인 테이블 + 보안용 `signup_allowlist` = **총 24개 (전부 RLS)**. 3단계 커뮤니티(`community_posts`/`community_comments`) 2개는 **설계만 — 아직 DB 미생성**.

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

**signup_allowlist** (2026-07-07, 가입 도메인 강제 예외 목록 — RLS ON, 정책 없음 = 클라이언트 접근 불가, 서버/`SECURITY DEFINER` 트리거만 참조)
- 실사용자는 `universities.domain` 매칭(`@kookmin.ac.kr`)만 가입 허용. 도메인 매칭이 없는 이메일은 이 목록에 있을 때만 예외 허용(관리자 gmail 등), 그 외는 `handle_new_user`에서 `RAISE EXCEPTION`으로 가입 거부.
- 예외 추가/삭제는 오너(대시보드/service role)만 가능.
```sql
signup_allowlist (
  email       text PK,
  note        text,
  created_at  timestamptz not null default now()
)
```

**users** (RLS 활성화, 민감 컬럼 BEFORE UPDATE 트리거 보호)
- **가입 도메인 강제 (2026-07-07)**: `handle_new_user`가 가입 이메일 도메인을 `universities.domain`과 대조 → 매칭 시 해당 학교로 배정. 매칭 없으면 `signup_allowlist`에 있는 이메일만 통과(기본 활성 학교로 배정), 아니면 가입 거부. 폼/API 우회와 무관하게 서버에서 강제.
- `real_name` 공개 범위: 기본은 본인 또는 친구(accepted)만 조회 가능. `real_name_public=true`이면 같은 학교 유저에게도 RPC(`get_user_real_name`)가 반환
- `department` 공개 범위: **기본 비공개(`department_public=false`, 2026-08-06 변경 — 실명과 동일 opt-in)**. 본인이 프로필 설정에서 켜야 공개. `false`이면 본인 외 표시 경로/RPC에서 `NULL`로 마스킹(Phase 1: raw REST 컬럼 차단은 별도 Phase 2)
- Google OAuth 가입 시 `handle_new_user` 트리거가 `full_name`(`심재성(학부생-자동차공학과)` 형식) 파싱 → `real_name`, `department` 자동 저장 (avatar_url 제외)
- 신규 가입 기본 `nickname`은 `user_랜덤값` 임시값으로 생성 — 온보딩에서 사용자가 직접 입력해야 시작 가능
- 활성 유저(`deleted_at IS NULL`) 기준 `lower(nickname)` 고유 인덱스로 중복 닉네임 방지
- 탈퇴 유저의 닉네임은 점유 해제되어 다른 사용자가 재사용 가능
- `real_name`: NULL → 값 최초 1회 허용 (온보딩), 이후 변경 불가
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
  department_public bool default false,        -- opt-in(2026-08-06 변경, 이전 true). 본인이 켜야 공개
  credit_balance int default 0,
  level         int default 1,
  level_score   float8 default 0,
  role          text default 'user',          -- 'user' | 'official' | 'admin'
  is_onboarded  bool default false,
  real_name_public bool default false,
  is_promoted   bool default false,        -- 승격(크리에이터) 뱃지, 관리자 승인 RPC/직접 SQL만 변경
  is_active     bool default true,
  fcm_token     text,
  visibility    text default 'public',        -- 'public' | 'close_friends'
  deleted_at    timestamptz,
  created_at    timestamptz default now()
)
-- 트리거 보호 컬럼 (auth.uid() 있을 때): role, university_id, is_active, email, real_name(값→값 변경),
--   is_promoted, credit_balance, level, level_score, created_at, is_onboarded(true→false 불가)
-- 공개 여부 컬럼(real_name_public, department_public)은 소유자 UPDATE 허용
-- handle_new_user()는 auth metadata의 real_name/full_name/name, avatar_url, department를 반영

official_accounts (          -- 기관 계정: 공식(학생회·단과대) / 동아리 = 조직 계정 (개인 아님)
  id                uuid PK,
  user_id           uuid FK → users unique,  -- 계정당 1개, on delete cascade
  type              text not null,           -- 'official' | 'club'
  scope             text default 'school',   -- 'school'(전교) | 'college'(단과대·미사용) | 'department'(학과)
  target_department text,                     -- scope=department일 때 users.department와 매칭
  target_college    text,                     -- scope=college용 (학과→단과대 매핑 데이터 없어 현재 미사용)
  verified_at       timestamptz,
  created_at        timestamptz default now()
)
-- RLS: SELECT 전체 authenticated(뱃지/발견 탭), 쓰기 정책 없음 → 관리자(service_role 직접 SQL)만 생성/수정
-- 기관 계정 지정은 관리자 직접 SQL. 승격은 관리자 승인 RPC 또는 auth.uid null인 관리 SQL만 허용.

promotion_requests (       -- 개인 크리에이터 승격 신청
  id          uuid PK default gen_random_uuid(),
  user_id     uuid FK → users on delete cascade,
  status      text default 'pending', -- pending | approved | rejected
  created_at  timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid FK → users on delete set null
)
-- index(status), index(user_id), index(reviewed_by), unique(user_id) where status='pending'
-- RLS: 본인 SELECT만. INSERT/UPDATE/DELETE 테이블 권한 없이 SECURITY DEFINER RPC로만 신청·심사.

post_impressions (          -- 피드 "본 글" 기록 (중복 노출 방지 / "모두 열람" 판정)
  user_id  uuid FK → users,   -- on delete cascade
  post_id  uuid FK → posts,   -- on delete cascade
  seen_at  timestamptz default now(),
  PK (user_id, post_id)
)
-- RLS: 본인(user_id = auth.uid()) 것만 SELECT/INSERT. 판정 기준(예: 80%·2초 노출)은 앱 클라가 계산 후 insert.
-- 피드 순서: 크루 안 본 최신 → 전교생 안 본 최신 → "모두 열람" → 랜덤 꼬리 (노션 📺 설계 9-2)
-- metric_events 원시 조회 이벤트와는 별개지만, 인사이트 도달은 이 테이블의 실제 피드 노출 고유 계정으로 집계.
-- nickname은 이메일 앞부분을 사용하지 않고 user_랜덤값으로 생성
-- unique index: users_active_nickname_lower_unique on lower(nickname) where deleted_at is null
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
  aspect_ratio   text default 'portrait',     -- 'square' | 'portrait' | 'landscape'
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
  url           text not null,                  -- Cloudflare 영상은 HLS URL
  thumbnail_url text,
  duration      int,
  order_index   int default 0,
  provider      text,                           -- null | 'cloudflare_stream'
  provider_asset_id text,                       -- Cloudflare Stream uid
  processing_status text default 'ready',       -- 'processing' | 'ready' | 'failed'
  created_at    timestamptz default now()
)
```

**stories**
```sql
stories (
  id            uuid PK default gen_random_uuid(),
  user_id       uuid FK → users,
  image_url     text,                          -- 사진/영상 URL. 게시물 리셰어는 null
  shared_post_id uuid FK → posts on delete set null, -- 링크식 게시물 리셰어 원본
  type          text not null default 'image', -- 'image' | 'video' (2026-06-26 추가)
  thumbnail_url text,                           -- 영상 미리보기 썸네일
  duration      int,                            -- 영상 길이(초)
  background_color text,                        -- 스토리 레터박스 배경색
  provider      text,                           -- null | 'cloudflare_stream'
  provider_asset_id text,                       -- Cloudflare Stream uid
  processing_status text default 'ready',       -- 'processing' | 'ready' | 'failed'
  university_id uuid FK → universities not null,
  views_count   int default 0,
  expires_at    timestamptz not null,         -- 생성 후 24시간 (피드에서 안 보임)
  is_archived   bool default false,           -- 보관함에서 확인 가능
  visibility    text default 'public',        -- 'public' | 'close_friends'
  deleted_at    timestamptz,                  -- 본인 직접 삭제
  created_at    timestamptz default now()
)
```

- `stories_media_or_shared_post_check`: `image_url IS NOT NULL OR shared_post_id IS NOT NULL`. 일반 스토리는 미디어 URL, 리셰어 스토리는 원본 게시물 ID를 반드시 가진다.
- `validate_story_shared_post_trigger`: 리셰어 생성/변경 시 `auth.uid()`가 작성한 삭제되지 않은 같은 학교 게시물만 허용한다. 현재 MVP는 본인 게시물 리셰어만 지원하며, 클라이언트 UI를 우회한 직접 INSERT도 거부한다.
- `stories_insert_own` INSERT RLS: `user_id = auth.uid()`이면서 `official_accounts`에 등록됐거나 `users.is_promoted = true`인 기관·승격 계정만 새 스토리를 작성할 수 있다. 일반 학생은 기존 스토리 조회만 가능하며 이미지/영상과 게시물 리셰어 INSERT 모두 같은 정책을 적용받는다.
- 앱 조회는 `shared_post_id` 원본을 posts RLS 아래에서 배치 조회하고 `deleted_at IS NULL`인 원본만 결합한다. 원본의 작성자·첫 미디어·캡션·`aspect_ratio`를 카드 모델로 조립하며, 원본이 삭제됐거나 접근 불가인 리셰어는 라이브 목록과 보관함에서 숨긴다.

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
-- 무방향 유니크 인덱스 user_connections_unordered_pair_key
--   ON (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id))
--   → A→B/B→A 중 한 행만 허용
```

**close_friends** (레거시 — 미사용)
```sql
close_friends (
  id         uuid PK default gen_random_uuid(),
  user_id    uuid FK → users,
  friend_id  uuid FK → users,
  created_at timestamptz default now(),
  UNIQUE(user_id, friend_id)
)
```
> ⚠️ 현재 코드에서 INSERT하지 않는 빈 테이블. 크루 관계는 `user_connections(status='accepted')`로 관리하며, posts/stories의 `close_friends`(크루공개) RLS도 `user_connections` 기준으로 판별한다(2026-06-09 변경).

**follows** (다학교 확장 대비 — 현재 미사용)
```sql
follows (
  id           uuid PK default gen_random_uuid(),
  follower_id  uuid FK → users,
  following_id uuid FK → users,
  created_at   timestamptz default now(),
  UNIQUE(follower_id, following_id)
)
```
> ⚠️ DB에 생성돼 있고 RLS 적용됨. 단 **현재 코드에서 참조/INSERT하지 않음**(같은 학교 MVP는 `user_connections` 크루 기반). 다학교 확장 시 팔로우 기반 탐색/피드에 사용 예정.

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

**user_favorites** (즐겨찾기 계정)
```sql
user_favorites (
  id               uuid PK default gen_random_uuid(),
  user_id          uuid FK → users on delete cascade,
  favorite_user_id uuid FK → users on delete cascade,
  created_at       timestamptz default now(),
  UNIQUE(user_id, favorite_user_id),
  CHECK(user_id <> favorite_user_id)
)
-- RLS: 본인(user_id = auth.uid()) 즐겨찾기만 조회/추가/삭제 가능
-- 계정 탈퇴 시 user_id 또는 favorite_user_id가 탈퇴 유저인 행은 즉시 삭제
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
-- comment_reply  내 댓글에 답글(대댓글)
-- user_like      내 프로필/계정 좋아요
-- friend_request 친구 신청
-- friend_accepted 친구 신청 수락
-- report_received 신고 접수
-- ⚠️ 좋아요 알림 집계(2026-08-05): notify_on_like/notify_on_comment_like 트리거가 새 알림을 만들지 않고,
--    같은 (수신자·type·대상)이 이미 있으면 created_at 갱신+is_read=false로 "맨 위로 올림"(인스타식 뭉치기).
--    앱은 좋아요 테이블을 대상별 실시간 집계(최근 N명+총 인원)해 "A님 외 N명"으로 표시.
```

**blocks**
```sql
blocks (
  id         uuid PK default gen_random_uuid(),
  blocker_id uuid FK → users,
  blocked_id uuid FK → users,
  created_at timestamptz default now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK(blocker_id <> blocked_id)
)
```

차단 RPC:
- `block_user(target_user_id uuid)` — 현재 유저가 대상 유저를 차단하고, 두 유저 사이의 `user_connections`와 `user_favorites`를 정리
- `get_block_related_user_ids()` — 현재 유저가 차단한 유저와 현재 유저를 차단한 유저 id를 모두 반환
- `get_blocked_users()` — 현재 유저가 차단한 유저 목록 반환 (id, nickname, avatar_url, department, 차단 시각). department는 본인 또는 `department_public=true`일 때만 값 반환
- `unblock_user(target_user_id uuid)` — 현재 유저가 특정 유저를 차단 해제 (친구 관계 자동 복구 없음)
- 앱 반영 범위: 피드, 게시물 상세, 유저 검색, 프로필 조회, 채팅 대화 목록, 메시지 전송에서 차단 관계 유저 숨김/차단

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
accept_friend_request(requester_user_id uuid)
reject_friend_request(target_user_id uuid)
remove_friend(target_user_id uuid)
get_connection_status(target_user_id uuid)
get_friends()
get_pending_requests()
get_sent_requests()
get_user_real_name(p_user_id uuid) returns text
get_account_badges() returns table(user_id uuid, affiliation text, promoted boolean)
get_friend_recommendations(p_limit int DEFAULT 20, p_seed float8 DEFAULT 0)
  returns table(user_id uuid, nickname text, avatar_url text, mutual_count int, same_dept boolean)
get_feed_post_ids(p_seed float8, p_limit int, p_after_band int, p_after_rank float8, p_half_life_days float8 DEFAULT 5)
  returns table(post_id uuid, band int, rank float8)
get_reel_post_ids(p_seed float8, p_seen_ids uuid[], p_limit int, p_after_band int, p_after_rank float8)
  returns table(post_id uuid, band int, rank float8)
get_popular_post_ids(p_limit int, p_offset int, p_half_life_hours float8 DEFAULT 120)
  returns table(post_id uuid, score float8)
recount_post_likes(p_post_id uuid) returns int
recount_post_comments(p_post_id uuid) returns int
recount_comment_likes(p_comment_id uuid) returns int
recount_story_views(p_story_id uuid) returns int
-- admin
ban_user(target_user_id uuid)
unban_user(target_user_id uuid)
update_user_role(target_user_id uuid, new_role text)
dismiss_report(report_id uuid)
take_action_on_report(report_id uuid)
```
- `search_users`는 같은 학교 범위와 학과 공개 마스킹을 적용하고 양방향 차단 관계의 사용자를 SQL에서 제외한다. `get_blocked_users`, `get_friends`, `get_pending_requests`, `get_sent_requests`도 department를 본인 또는 `department_public=true`일 때만 반환하고, 그 외에는 `null`을 반환한다.
- `get_user_real_name`은 양방향 차단 관계면 항상 `null`을 반환한다. 비차단 관계에서는 본인, accepted 크루 관계 또는 같은 학교 대상 유저의 `real_name_public=true`일 때만 실명을 반환한다.
- `get_connection_status`는 양방향 차단 관계에서 연결 상태와 대상의 크루 수를 노출하지 않고 `{ status: "none", is_requester: false, friends_count: 0 }`을 반환한다.
- `get_feed_post_ids`는 홈피드 **순서(정렬된 post id + band + rank)만** 반환한다. 내용(작성자·미디어)은 앱이 이 순서로 기존 임베딩 쿼리를 돌려 채운다. band 0=크루 안 본 최신 / 1=전교생 안 본 핫스코어 / 2=본 글 랜덤 꼬리(시드 고정). band 1 점수는 `(1 + likes_count + comments_count*2) × 0.5^(경과일 / half_life_days, 기본 5일)`이며, 기본점수 1로 참여 0 게시물도 시간 감쇠 rank를 가져 rank-only 커서의 0점 동률을 방지하고 참여 0끼리는 최신순이 된다. SECURITY INVOKER라 posts RLS(같은 학교+공개범위)가 자동 적용되고 함수에서는 차단을 제외한다. `(band, rank)` 커서로 무한스크롤하며 seed는 band 2에만 사용한다. `p_limit`은 서버에서 1~100으로 제한하고 반감기는 `(0, 365]`일 범위 밖이면 기본 5일로 정규화한다. 현재 참여 카운트는 같은 학교 반응만 반영하며 다학교·크로스스쿨 확장 시 학교 내부 카운트 분리가 필요하다. 승격 계정 재삽입은 미구현이다.
- `get_reel_post_ids`는 릴스(영상 전용) **순서만** 반환한다. 크루 구분 없이 다 섞기 — band 0=세션에서 안 본 영상(시드 셔플) / 1=세션에서 본 영상(시드 셔플, 무한 루프용). "본 것"은 세션 개념이라 DB 저장 없이 앱이 `p_seen_ids`(이번 세션 본 릴스 id)로 넘긴다. 영상(`post_media.type='video'`)만, SECURITY INVOKER(공개범위 자동), 차단 제외, `(band, rank)` 커서이며 `p_limit`은 1~100으로 제한한다. 완주율/가중치 추천은 나중.
- `get_popular_post_ids`(2026-08-06)는 탐색 그리드/검색 인기 차트용 **인기순 post id + score**를 반환한다. 점수 = `(likes_count + comments_count*2) × 0.5^(경과h / half_life_hours, 기본 120h)`. SECURITY INVOKER(posts RLS=같은 학교+공개범위 자동), 함수에서 내 글·차단·미디어 없는 글 제외. `p_limit`은 1~100, `p_offset`은 0~10000으로 제한하고 반감기는 `(0, 8760]`시간 범위 밖이면 기본 120시간으로 정규화한다. `explore/api.ts`가 이 순서로 그리드 조립. ⚠️ 설계상 창작자 유저당 2개 캡(마이그레이션 `20260806160000`)이 있으나 라이브 DB는 테스트로 캡 제거 상태(2026-08-07), 최종 캡 값 확정 시 정리 예정.
- `recount_*` RPC는 출처 테이블(`post_likes`, `comments`, `comment_likes`, `story_views`)에서 카운트를 재계산해 `posts/comments/stories` 카운터 컬럼을 갱신한다. 호출자는 대상 소유자·현재 상호작용 당사자여야 하며, 게시물 계열은 unlike/댓글 hard delete 후 상호작용 행이 이미 사라지는 기존 흐름을 위해 같은 학교·공개범위 또는 accepted 크루·비차단 조건상 실제 상호작용 가능한 사용자도 허용한다. 스토리 조회수는 소유자 또는 해당 스토리 조회 행이 있는 사용자만 실행할 수 있다.
- 앱 클라이언트는 좋아요/댓글/조회 row 생성·삭제 후 직접 카운터 UPDATE를 하지 않고 이 RPC만 호출한다.
- `get_account_badges`(2026-08-06)는 배지 있는 유저마다 소속(`official_accounts.type` official→`council`·club→`club`)과 승격(`users.is_promoted`)을 한 행으로 반환한다. 계정 배지(학생회/동아리 pill + 승격 심볼)용이며 공개 웹 호출 경로가 없어 `PUBLIC`/`anon` 권한을 회수하고 `authenticated`만 허용한다. `get_verified_user_ids`도 같은 ACL을 사용한다. ⚠️ `official`이 운영자/공식 계정까지 포함 → "학생회 vs 운영자" 구분(type `council` 추가)은 실 학생회 계정 받을 때 결정.
- `get_friend_recommendations`(2026-08-07, fallback·기관/승격 제외 2026-08-11)는 같은 학교의 아직 크루가 아닌 유저를 `공통 크루 있음(tier 1, mutual_count DESC) → 같은 학과(tier 2) → 그 외 같은 학교 seed 셔플(tier 3)` 순서로 반환한다. 신호 후보를 먼저 모두 배치한 뒤 `p_limit`의 남는 자리만 fallback으로 채우며, tier 3은 `md5(user_id || p_seed)` 순서라 같은 화면 세션에서는 고정되고 새 진입 seed에서는 바뀐다. 본인·accepted/pending 양방향 연결·양방향 차단·다른 학교·비활성/탈퇴 유저와 `official_accounts`에 등록된 기관 계정 및 `users.is_promoted=true` 승격 계정을 제외하며, 개인정보 보호를 위해 학과명/실명 대신 `mutual_count`와 `same_dept`만 반환한다. 연결 전체 계산을 위해 SECURITY DEFINER를 사용하되 함수 내부 `auth.uid()` 확인, 같은 학교 범위, `PUBLIC`/`anon` 실행 권한 회수 후 `authenticated`만 허용한다. 보조 인덱스 `idx_users_university_active`, `idx_blocks_blocked_id`를 사용한다.
- `send_friend_request`와 `accept_friend_request`(2026-08-11, 보안 보강 2026-08-14)는 호출자와 상대가 모두 활성·미탈퇴 상태이고 같은 학교이며 양방향 차단 관계가 없을 때만 동작한다. 기존 기관/승격 계정 차단도 유지한다. `send_friend_request`는 반대 방향 pending이 있으면 새 행을 만들지 않고 기존 행을 accepted로 자동 전환하며, 무방향 유니크 인덱스로 A→B/B→A 중복을 DB에서도 차단한다. 두 SECURITY DEFINER 함수는 `search_path=''`를 사용하고 `PUBLIC`/`anon` 실행 권한을 회수해 `authenticated`만 허용한다. 마이그레이션 당시 해당 계정이 포함된 기존 accepted 연결 1건은 자동 삭제하지 않았으며, 소유자 확인 후 별도 정리한다.
- 보안 감사 배치 2 마이그레이션 `20260814030746_secure_medium_rpcs_batch_2`는 원격에만 있던 `record_metric`, `get_metric_counts`, `get_metric_daily`, `recount_*` 4개, `get_verified_user_ids` 총 8개 함수의 최종 정의를 로컬 이력에 백필한다. 수정·백필 함수는 `search_path=''`와 `public.` 완전 수식명을 사용하고, 앱 전용 SECURITY DEFINER RPC는 `PUBLIC`/`anon` 실행 권한을 회수해 `authenticated`만 허용한다.
- `request_promotion()`(2026-08-14)은 활성·미탈퇴 일반 계정이 삭제되지 않은 게시물 10개 이상과 최근 30일 3개 이상을 충족할 때 pending 승격 신청을 만든다. 이미 승격/기관 계정, pending 중복, 최근 거절 후 7일 이내 재신청은 서버에서 거부한다. `get_promotion_requests_for_admin()`은 활성 관리자만 pending 신청자의 게시물·조회·피드 도달 고유 계정·참여·영상·평균 완주율 성적표를 조회할 수 있다. `approve_promotion`/`reject_promotion`은 pending 행을 잠근 뒤 처리 상태와 담당 관리자를 기록하고 승인 시 `users.is_promoted=true`, 양쪽 모두 신청자 알림을 생성한다. 네 RPC는 SECURITY DEFINER, `search_path=''`, `authenticated` 전용이며 `PUBLIC`/`anon` 실행 권한을 회수한다. 마이그레이션 `20260814070945_promotion_requests`.
- `get_post_insight_for_admin(p_post_id)`과 `get_post_comments_for_admin(p_post_id)`(2026-08-14)은 승격 심사용 관리자 전용 조회다. 전자는 임의의 삭제되지 않은 게시물에 대해 조회(`post_view`+`reel_view`), 피드 도달 고유 계정, 좋아요·댓글·저장·삭제되지 않은 DM/스토리 공유와 영상 완주율·평균 시청깊이를 반환하고, 후자는 댓글 작성자 닉네임·아바타·내용·작성일을 오래된 순으로 반환한다. 두 SECURITY DEFINER 함수 모두 활성·미탈퇴 `role='admin'`을 내부에서 확인하고 `search_path=''`, 완전 수식 테이블명, `PUBLIC`/`anon` 실행 권한 회수를 적용한다. 원격 `comments`는 `deleted_at` 없이 hard delete되므로 댓글 RPC도 현재 행만 조회한다. 마이그레이션 `20260814081512_admin_post_review_details`, `20260814081715_fix_admin_post_comments_remote_schema`.
- `prevent_sensitive_user_update`는 `is_promoted` 변경에만 활성·미탈퇴 `role='admin'` 호출자를 허용한다. 일반 사용자의 자가 승격과 관리자에 의한 role·학교·크레딧 등 다른 민감 컬럼 변경은 기존대로 거부한다.

**푸시 (한 기기 = 한 계정 + 서버 트리거 발송)**
- 발송: `push_on_message`(messages insert), `push_on_notification`(notifications insert; `post_comment`·`comment_reply`·`promotion_approved`·`promotion_rejected`) 트리거가 `net.http_post`로 Expo Push(`exp.host/--/api/v2/push/send`) 호출. payload `priority:'high'` + `channelId:'alerts'`(2026-08-06 `default`→`alerts`, 낮게 굳은 채널 회피). 제목은 발신자 닉네임 or `unip`.
- `claim_push_token(p_token text)` — SECURITY DEFINER. 등록 시 `p_token`을 가진 **다른 유저 행에서 `fcm_token`을 NULL로** 떼어내고(`id <> auth.uid()`) 현재 유저에 등록. 클라가 RLS로 남의 행을 못 비우므로 definer로 처리. (2026-06-28 추가)
- 앱 `registerForPushNotifications`가 `users.fcm_token` 직접 UPDATE 대신 이 RPC 호출. 로그아웃 시에도 본인 토큰 NULL(`signOutMobile`). → 같은 기기로 계정 전환해도 이전 계정으로 푸시 안 감.
- 멀티기기(한 계정이 여러 기기 동시 수신)는 단일 `fcm_token` 컬럼이라 미지원(마지막 로그인 기기만 수신). 별도 토큰 테이블은 백로그.

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
  message_type    text default 'text', -- 'text' | 'image' | 'system' | 'post'
  content         text not null,
  shared_post_id  uuid FK → posts on delete set null,
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

### 3단계 — 커뮤니티 2개 (⚠️ 설계만 — 아직 DB에 생성 안 됨. 2·3단계에서 생성 예정)

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

### 지표(인사이트) — 2개

**metric_events** (사용자에게 보여줄 지표. 평범한 학생을 크리에이터로 전환시키는 "거울" 전략)
```sql
metric_events (
  id          uuid PK default gen_random_uuid(),
  actor_id    uuid FK → auth.users on delete cascade,   -- 행동한 사람(본인 제외하고 기록)
  owner_id    uuid FK → auth.users on delete cascade,   -- 콘텐츠/프로필 주인(지표 조회 주체)
  metric_type text not null,   -- reel_view | post_view | profile_visit | link_click (CHECK)
  target_id   text not null,   -- 릴스/게시물 id, 프로필 owner id, 링크는 URL
  event_date  date not null default (now() at time zone 'Asia/Seoul')::date,  -- KST
  created_at  timestamptz default now()
)
-- 부분 유니크 인덱스 metric_events_daily_unique
--   ON (actor_id, metric_type, target_id, event_date) WHERE metric_type = 'link_click'
--   → link_click만 1인 1일 1회. 나머지(조회형)는 원시 이벤트로 저장.
-- 인덱스 metric_events_owner_query ON (owner_id, metric_type, target_id, event_date)
```
- **개념(인스타 공식 정의 정합)**: 조회수(Views)=재생/열람 총 횟수(반복 포함)=`count(*)`, 도달(Reach)=고유 계정=`count(distinct actor_id)`. dedupe 안 하므로 한 지표에서 total(조회)·unique(도달) 둘 다 나옴.
- **기록 트리거(클라)**: 릴스=활성 1초 이상 머물면(스크롤백=새 조회), 게시물=상세 열림, 프로필=남 프로필 로드, 링크=프로필 링크 탭.
- **RPC**:
  - `record_metric(p_metric_type, p_target_id)` — SECURITY DEFINER, `authenticated`만 GRANT, `public`/`anon` REVOKE. actor는 `auth.uid()`로 고정하고 owner를 클라이언트에서 받지 않는다. `post_view`/`reel_view`는 삭제되지 않은 `posts.id`, `profile_visit`은 활성·미탈퇴 `users.id`, `link_click`은 실제 `profile_links.id`에서 owner를 서버가 계산한다. 링크는 검증 후 기존 집계 호환을 위해 URL을 `metric_events.target_id`에 저장한다. 비로그인·본인 이벤트와 유효하지 않은 target은 기록하지 않고, 조회형은 원시 이벤트를 유지하며 link_click만 하루 중복을 무시한다.
  - `get_metric_counts(p_metric_type, p_target_id?, p_start?, p_end?)` → `(total, unique_actors)`, `owner_id = auth.uid()` 본인만. `PUBLIC`/`anon` 실행 권한은 회수하고 `authenticated`만 허용한다.
  - `get_metric_daily(...)` → `(day, total, unique_actors)` 일별. `get_metric_counts`와 동일하게 인증 사용자 전용이다.
  - `get_post_impression_reach(p_start, p_end)`(2026-08-14) → 홈 피드에서 내 게시물이 실제 노출된 `post_impressions.seen_at`을 KST 날짜로 집계해 `(day, daily_unique, period_unique)`를 반환한다. `daily_unique`는 날짜별 고유 계정이고 `period_unique`는 기간 전체 distinct viewer라 일별 값을 단순 합산하지 않는다. 삭제되지 않은 본인 게시물만 포함하며 본인 노출은 제외한다.
  - `get_content_performance()`(2026-08-12) → 본인 게시물별 `(post_id, created_at, thumbnail_url, is_video, likes, comments, saves, shares)`. 승격(크리에이터) 인사이트 A "콘텐츠 성과"용. likes/comments는 posts 카운터 컬럼, saves는 `bookmarks` count, shares는 DM 리셰어(`messages.shared_post_id`)+스토리 리셰어(`stories.shared_post_id`) 합산(둘 다 `deleted_at is null`). `where user_id = auth.uid() and deleted_at is null`로 본인 글만, `created_at desc` 정렬. metric_events가 아니라 기존 참여 테이블 집계라 데이터가 이미 쌓여 있으며, 앱 콘텐츠 탭은 기관·승격 계정에만 노출한다.
  - `get_engagement_daily(p_start, p_end)`(2026-08-13) → `(day, total)`. 삭제되지 않은 내 게시물에 발생한 좋아요·댓글·저장·DM 공유·스토리 공유를 각 원본 테이블 `created_at`의 KST 날짜로 일별 합산한다. 삭제된 메시지/스토리 공유는 제외한다.
  - `get_views_by_type(p_start, p_end)`(2026-08-13) → `(reel, post, story)`. 릴스·게시물은 본인 소유 `metric_events`의 `event_date`, 스토리는 내 스토리의 `story_views.created_at` KST 날짜를 집계한다.
  - `get_post_insight(p_post_id)`(2026-08-13, 도달 기준 2026-08-14 수정) → 삭제되지 않은 본인 게시물 단건의 `(created_at, thumbnail_url, is_video, views, reach, likes, comments, saves, shares, video_duration_ms, completion_rate, avg_depth, avg_loops)`. 조회는 `post_view`+`reel_view` 원시 이벤트 수를 유지하고, 도달은 해당 글의 `post_impressions` distinct viewer로 계산한다. 상호작용은 posts 카운터·저장·삭제되지 않은 DM/스토리 리셰어를 합산한다. 영상 길이는 해당 게시물 시청 세션의 중앙값이며 세션이 없거나 사진이면 영상 필드는 null이다. 관리자 심사는 소유자 제한 대신 함수 내부 관리자 검증을 적용한 별도 `get_post_insight_for_admin`을 사용한다.
  - `get_post_retention(p_post_id)`(2026-08-13) → 영상 시청 세션이 있는 삭제되지 않은 본인 영상에 대해 `(bucket_pct, retention)`을 0~100%, 5% 간격으로 반환한다. `retention = max_pct >= bucket` 세션 비율이므로 수동 스크럽 없는 v1 플레이어의 순차 시청 유지율로 사용한다. 세션이 없거나 사진·타인 글이면 0행이다.
- 마이그레이션: `metrics_foundation`(테이블·인덱스·RPC), `metrics_post_view_rename_and_raw_events`(post_reach→post_view 개명 + dedupe를 link_click만으로 축소), `get_content_performance`(2026-08-12, 콘텐츠 성과 RPC), `20260813063146_insights_dashboard_aggregates`(반응 일별·유형별 조회), `20260813064742_exclude_deleted_posts_from_engagement`(삭제 게시물 반응 제외), `20260813090242_post_insight_detail`(단건 인사이트·유지율 RPC), `20260814024836_secure_high_risk_rpcs_batch_1`(기록 owner 서버 계산·크루 관계 검증·무방향 유니크), `20260814030746_secure_medium_rpcs_batch_2`(누락 함수 백필·RPC ACL/인자 하드닝), `20260814053722_insight_reach_from_post_impressions`(개요·게시물 상세 도달을 피드 노출 기반으로 교체), `20260814081512_admin_post_review_details`·`20260814081715_fix_admin_post_comments_remote_schema`(관리자 심사 단건 지표·댓글 조회).
- 2026-08-13 신규 인사이트 집계 RPC들은 SECURITY DEFINER이며 `auth.uid()` 소유자 범위로 제한한다. `public`/`anon` 실행 권한은 회수하고 `authenticated`에만 실행 권한을 부여한다.
- 표시: 설정 > 계정 > 인사이트(본인만). 상세 설계는 노션 `📊 인사이트(지표) 시스템 설계`.

**reel_watch_events** (릴스 활성 시청 구간별 완주·깊이·반복·이탈 원시 이벤트)
```sql
reel_watch_events (
  id                uuid PK default gen_random_uuid(),
  event_id          uuid not null unique,  -- 클라이언트 세션 ID, 재전송 멱등 키
  actor_id          uuid FK → auth.users on delete cascade,
  owner_id          uuid FK → auth.users on delete cascade,
  post_id           uuid FK → posts on delete set null,
  video_duration_ms int not null check (> 0),
  max_pct           smallint not null check (0..100),
  completed         boolean not null,
  loops             smallint not null check (>= 0),
  event_date        date not null default (now() at time zone 'Asia/Seoul')::date,
  created_at        timestamptz not null default now()
)
-- unique(event_id), index reel_watch_events_owner_date_idx(owner_id, event_date)
-- index reel_watch_events_owner_post_idx(owner_id, post_id) — 게시물 상세 영상 집계
```
- **세션 기준**: 릴스가 활성 상태에서 실제 재생을 시작하면 생성하고, 비활성 전환·컴포넌트 해제·앱 백그라운드에서 확정한다. 누적 실제 재생 위치 증가량이 1초 미만이면 저장하지 않는다. 스크롤백은 새 `event_id` 세션이다.
- **깊이/완주/반복**: 첫 재생의 최대 진행률을 `max_pct`로 저장한다. `이전 진행률 > 85%`에서 `현재 < 15%`로 이동하면 루프로 판정해 `loops`를 올리고 첫 재생 깊이를 고정한다. `max_pct >= 95` 또는 루프 1회 이상이면 완주다.
- **RPC** (SECURITY DEFINER, `authenticated`만 GRANT, `public`/`anon` REVOKE):
  - `record_reel_watch(p_event_id, p_post_id, p_video_duration_ms, p_max_pct, p_completed, p_loops)` — actor=`auth.uid()`, 비로그인·본인 시청 제외. 클라이언트 owner 인자를 받지 않고 실제 삭제되지 않은 영상 게시물의 owner를 `p_post_id`에서 서버가 계산하며, `on conflict(event_id) do nothing`으로 멱등 기록한다.
  - `get_video_watch_summary(p_start, p_end)` → `(sessions, completion_rate, avg_depth, avg_loops, avg_exit_pct)`. `owner_id=auth.uid()`이며 삭제되지 않은 본인 영상 세션만 KST `event_date` 범위로 집계하고, 평균 이탈 지점은 미완주 세션의 `max_pct` 평균이다.
  - 게시물 단건 영상 지표와 유지율은 위 `get_post_insight`/`get_post_retention`이 같은 원시 이벤트를 `post_id`로 집계한다.
- RLS 활성·정책 없음 + `public`/`anon`/`authenticated` 테이블 권한 회수로 원시 행 직접 조회·수정을 차단한다. 앱은 기록 RPC로 원시 이벤트를 저장하고 게시물 인사이트 상세에서는 집계 RPC 결과만 조회한다.
- 마이그레이션: `20260813073806_reel_watch_metrics`, `20260814024836_secure_high_risk_rpcs_batch_1`(owner 인자 제거·서버 계산).

---

## RLS 정책 요약

| 테이블 | 읽기 | 쓰기 |
|---|---|---|
| universities | 전체 공개 | 관리자만 |
| users | 같은 학교 유저 | 본인만 |
| profile_links | 로그인 유저 | 본인만 |
| posts | 같은 학교 + visibility 체크 (크루공개는 user_connections accepted) | 본인만 |
| post_media | 같은 학교 유저 | 본인만 |
| stories | 같은 학교 + visibility 체크 (크루공개는 user_connections accepted) | 기관·승격 계정의 본인 행만 INSERT, 본인만 UPDATE/DELETE |
| story_views | 본인만 | 로그인 유저 |
| post_likes | 공개 | 로그인 유저 |
| comment_likes | 공개 | 로그인 유저 |
| user_connections | 공개 | 로그인 유저 |
| close_friends | 본인만 | 본인만 |
| comments | 같은 학교 유저 | 본인만 |
| bookmarks | 본인만 | 본인만 |
| user_favorites | 본인만 | 본인만 |
| notifications | 본인만 | 시스템 |
| promotion_requests | 본인 신청만 | SECURITY DEFINER RPC(request/approve/reject)만 |
| blocks | 본인 차단 목록 | 본인 차단 생성/삭제 |
| reports | 본인만 | 로그인 유저 |
| conversations | 참여자만 | 로그인 유저 |
| messages | 참여자만 | 참여자만 |
| community_posts | 같은 학교 유저 | 본인만 |
| community_comments | 같은 학교 유저 | 본인만 |
| metric_events | RLS 활성·정책 없음(직접 조회 불가) | SECURITY DEFINER RPC(record_metric)만 |
| reel_watch_events | RLS 활성·정책 없음 + 테이블 권한 회수(직접 조회 불가) | SECURITY DEFINER RPC(record_reel_watch)만 |

---

## Storage 버킷

| 버킷 | 공개 | 용량 제한 | 허용 형식 | 업로드 경로 |
|---|---|---|---|---|
| avatars | public | 5MB | image/jpeg·png·webp | `{userId}/{uuid}.jpg` |
| post-images | public | 10MB | image/jpeg·png·webp | `posts/{uuid}.jpg` |
| post-videos | public | 100MB | video/mp4·quicktime·webm | 레거시/폴백용. 신규 게시물 영상은 Cloudflare Stream |
| story-images | public | 10MB | image/jpeg·png·webp | `stories/{uuid}.jpg` |
| story-videos | public | 50MB | video/mp4·quicktime | 레거시/폴백용. 신규 스토리 영상은 Cloudflare Stream |

- 정책(`storage.objects` RLS): 읽기/업로드 모두 `authenticated`(로그인 유저)만. 익명 업로드 불가. 삭제는 post-videos만 `owner` 기준 정책 있음.
- 용량/형식 제한은 2026-06-26 추가(`20260626100000_set_image_bucket_limits`). 거대/비이미지 파일 업로드 악용 방지.
- ⚠️ **공개범위 한계**: 모든 버킷이 `public=true`라 **공개 URL은 RLS를 거치지 않음** → 크루공개/비공개 콘텐츠도 URL만 알면 비로그인 조회 가능. 민감 범위(크루공개/DM/비공개 영상)는 추후 private 버킷 + signed URL 전환 필요(보안 검토 #2).
- 신규 영상은 Cloudflare Stream direct upload 사용. 앱은 Supabase Edge Function `stream-upload-url`에서 1회용 업로드 URL을 받고, 처리 완료는 `stream-webhook`이 `processing_status`를 갱신한다.
