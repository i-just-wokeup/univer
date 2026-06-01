# WORKLOG

작업 완료 후 날짜별로 누적 기록.

---

## 2026-06-01

### 완료
- 채팅 수신 메시지 자동 스크롤
  - 상대방 메시지가 Realtime으로 추가될 때 화면이 맨 아래로 자동 스크롤되지 않던 문제 수정
  - `previousLastMessageIdRef`로 마지막 메시지 ID를 추적해 새 메시지가 추가됐을 때만 하단 스크롤 실행
  - loadMore(이전 메시지 추가 로드) 시에는 스크롤 위치 보정 로직 그대로 유지
- 채팅방 fullscreen route group 분리
  - `/messages` 대화 목록은 `(main)` 레이아웃 유지
  - `/messages/[conversationId]` 채팅방은 `(fullscreen)`으로 이동해 하단 탭바/사이드바 제거
  - 채팅방 root를 `h-dvh` 기반 전용 화면으로 변경하고 메시지 영역만 스크롤되도록 조정
  - 뒤로가기 버튼은 항상 `/messages`로 이동하도록 변경
- 채팅 전송 후 모바일 키보드 깜빡임 완화
  - 입력창 focus를 이미 활성 상태일 때는 다시 호출하지 않도록 조건부 처리
  - 전송 핸들러의 직접 `scrollIntoView` 호출 제거
  - 전송 성공 후 대화 목록 `reload()` 대기를 제거하고 메시지 변경 effect에 스크롤 책임 집중

## 2026-05-31

### 완료
- 채팅 연속 전송 UX 개선
  - 메시지 전송 요청 완료를 기다리지 않고 입력창을 즉시 비우도록 변경
  - 전송 중에도 textarea/전송 버튼을 잠그지 않아 여러 메시지를 연속 입력/전송 가능
  - 기존 낙관적 메시지/실패 처리 흐름은 유지

## 2026-05-27

### 완료
- **users 테이블 RLS 활성화 + 민감 컬럼 보호** (보안 취약점 수정)
  - 기존 문제: RLS 비활성화 상태 → anon key REST 직접 호출로 모든 유저 이메일/실명/role 노출
  - 기존 문제: `users_update_own` 정책에 컬럼 제한 없어 자가 admin 승격 등 가능
  - 적용:
    - RLS 활성화 (`relrowsecurity = true`)
    - `users_select`: 로그인 유저는 활성 유저(`deleted_at IS NULL`) 조회 가능 — 재귀 없는 단순 정책
    - `users_select_own`: 본인은 deleted_at 무관 조회 (탈퇴 복구 흐름 대비)
    - `users_update_own`: 본인 row만 UPDATE
    - `prevent_sensitive_user_update()` BEFORE UPDATE 트리거 — 민감 컬럼 변경 차단
  - 차단 컬럼: `role`, `university_id`, `is_active`, `email`, `real_name`, `credit_balance`, `level`, `level_score`, `created_at`
  - 부분 허용: `is_onboarded` (false → true 1회만, 온보딩 완료용)
  - bypass: `auth.uid() IS NULL`이면 트리거 통과 (handle_new_user, service_role, postgres 직접 접근)
  - 검증: RLS 활성화 ✓, 정책 3개 ✓, 트리거 1개 ✓
  - migration 파일: `supabase/migrations/20260527150000_enable_users_rls_with_sensitive_column_protection.sql`
- Supabase migration 로컬 파일 정리
  - `npx supabase login` + `supabase link` + `supabase db pull`로 `supabase/migrations/` 폴더 생성
  - db pull로 누락된 4개 migration 파일 수동 생성 (DB에서 DDL 직접 추출하여 동일하게 작성)
    - `20260521014413_create_user_connections.sql`
    - `20260521014544_create_notification_triggers.sql`
    - `20260520064729_create_admin_rpc_functions.sql`
    - `20260527015619_create_chat_tables.sql`
  - DB 재생성/복구 시 로컬 파일로 스키마 재현 가능한 상태
- 1:1 채팅 기능 1차 구현
  - `conversations`, `messages` 타입 및 채팅 RPC 타입 반영
  - `features/chat/api.ts` 추가 (`getOrCreateConversation`, 목록/메시지 조회, 전송, 읽음 처리, 요청 수락, 안읽은 수)
  - `features/chat/hooks.ts` 추가 (메시지/대화 목록 Realtime 구독 및 cleanup)
  - `components/chat/` UI 추가 (`ConversationItem`, `MessageBubble`, `MessageInput`)
  - `/messages`, `/messages/[conversationId]` 라우트 추가
  - 프로필 페이지 "메시지 보내기" 버튼 연결
  - 사이드바/모바일 헤더 메시지 링크를 `/messages`로 연결하고 안읽은 메시지 뱃지 표시
- 검증 완료
  - `npm run lint` 통과
  - `npm run build` 통과
- 채팅 실시간 업데이트 및 시간 표시 개선
  - 대화 목록 Realtime/chat refresh 갱신 시 로딩 스켈레톤 없이 조용히 갱신하도록 분리
  - 사이드바 메시지 뱃지를 30초 polling 대신 conversations Realtime UPDATE 구독으로 즉시 갱신
  - 채팅용 KST 시간 포맷(`formatChatTime`) 추가
  - 메시지 시간/읽음 상태를 hover 시에만 표시하도록 변경
  - 메시지 간 5분 이상 차이가 날 때 시간 구분선 표시
- 검증 완료
  - `npm run lint` 통과
  - `npm run build` 통과
- 채팅 UI 추가 개선
  - 메시지 간격 축소 (`space-y-3` → `space-y-0.5`)
  - MessageBubble 시간 표시를 말풍선 아래(height 차지)에서 옆 flex 레이아웃으로 변경 — 가로 overflow 없이 빈 공간에 표시
  - 채팅방 `overflow-x-hidden` 추가로 가로 스크롤 방지
  - NavItems Realtime 채널 이름 중복 버그 수정 (`"nav:conversations"` → `"nav:conversations:${Date.now()}"`) — React StrictMode 이중 마운트로 인한 에러
- 채팅 메시지 페이지네이션 구현
  - `getMessages`를 DESC+reverse 방식으로 변경 — 항상 최신 50개를 가져와 오름차순 표시
  - `before` cursor 파라미터 추가 — 특정 시점 이전 메시지 조회 지원
  - `useMessages` 훅에 `hasMore`, `isLoadingMore`, `loadMore` 추가
  - 채팅방 상단 스크롤 감지 시 이전 메시지 자동 로드 (prepend)
  - prepend 후 scrollHeight 차이만큼 scrollTop 보정 — 스크롤 위치 튀는 현상 방지
  - "이전 메시지 불러오는 중..." / "첫 번째 메시지입니다." UI 추가
- 채팅 메시지 낙관적 전송 처리
  - 전송 즉시 임시 메시지를 목록 끝에 추가하고 성공 시 실제 메시지로 교체
  - Realtime INSERT 수신 시 동일 발신자/내용의 낙관적 메시지를 실제 메시지로 대체해 중복 표시 방지
  - 전송 실패 시 임시 메시지 제거, 성공 후에만 대화 목록 reload 실행
  - 낙관적 메시지는 흐리게 표시해 전송 중 상태 구분
- 채팅 전송 후 UX 버그 수정
  - 메시지 전송 완료 후 입력창 포커스 유지
  - 전송 성공 및 대화 목록 갱신 후 채팅방 하단으로 부드럽게 스크롤
- 채팅 Realtime 미수신 원인 수정
  - `messages` INSERT 구독 filter에 UUID가 섞여 `conversation_id` 매칭이 실패하던 문제 수정
  - 채널 이름만 UUID로 유니크하게 유지하고 filter는 `conversation_id=eq.{id}`로 복구
  - `messages`, `conversations` 테이블을 `supabase_realtime` publication에 등록하는 migration 추가

## 2026-05-26

### 완료
- 개발 환경 안정화
  - `C:\Users\PC\.wslconfig` 신규 생성 (`memory=8GB`, `processors=4`)
  - `package.json` dev 스크립트에 `NODE_OPTIONS=--max_old_space_size=4096` 추가
- 코드 정리
  - 미사용 중복 파일 3개 삭제 (auth alias login/signup, 구버전 posts/write)
  - `getFeed` 기본 조회 limit `3` → `20` 복구
- 스토리 뷰어 이미지 비율 판정
  - `onLoad`에서 `naturalHeight > naturalWidth` 판정
  - 세로 사진은 `object-cover`로 꽉 채우고, 가로/정사각형은 `object-contain` + 블러 배경 유지
- 스토리 목록 정렬 개선
  - `getStories()`에서 accepted 상태 `user_connections`를 조회해 크루 ID Set 생성
  - 친구 조회 실패 시 빈 목록 fallback으로 스토리 로딩은 계속 진행
  - 스토리바 정렬을 내 스토리 → 크루 → 같은 학교 나머지 순서로 변경
- 크로스 유저 스토리 네비게이션 구현
  - StoryBar에서 정렬된 유저 ID 목록을 `users` 쿼리로 스토리 뷰어에 전달
  - 스토리 뷰어에서 마지막/첫 스토리 이동 시 다음/이전 유저 스토리로 이동
  - 데스크톱 사이드 프리뷰 카드 및 `getStoryPreview()` API 추가
  - 진행 타이머의 Router 업데이트를 `setTimeout(0)` 경유로 처리
- 스토리 뷰어 레이아웃 보정
  - 메인 스토리를 중앙 고정하는 3열 그리드 구조로 변경
  - 이전/다음 화살표를 absolute 오버레이에서 좌우 열 내부 버튼으로 이동
  - 프리뷰가 없는 경우에도 좌우 열 공간을 유지하도록 배치 조정
- 문서 최신화
  - 코드 기준으로 `AGENTS.md`, `docs/PLAN.md`, `docs/WORKLOG.md` 현재 상태 반영

## 2026-05-25

### 완료
- React 19/Next 16 hook lint 에러 수정
  - `/search` 최근 검색 초기화를 `useState` lazy initializer로 변경
  - 메인 레이아웃 알림 패널 닫힘 상태를 pathname 기반으로 계산하도록 조정
  - 프로필 편집 닉네임 상태 업데이트를 effect 내부 타이머 콜백으로 이동하고 `initialNickname` 의존성 추가
  - 관리자 대시보드/신고/유저 목록 로드 함수를 `useCallback`으로 고정하고 effect 초기 호출을 타이머 콜백으로 지연
- 검증 완료
  - `npm run lint` 통과
  - `npm run build` 통과
- 크루 목록 및 요청 관리 페이지 구현
  - `get_friends`, `get_pending_requests`, `get_sent_requests` RPC 마이그레이션 추가
  - `src/features/profile/api.ts`에 크루 목록/받은 요청/보낸 요청 조회 함수 추가
  - `/profile/connections` 페이지 추가 (내 크루/받은 요청/보낸 요청 탭, 수락/거절/삭제/취소 액션)
  - 본인 프로필의 크루 수 클릭 시 `/profile/connections`로 이동하도록 연결
- Supabase RPC 직접 적용 (마이그레이션 파일만 있었고 미적용 상태였음)
  - `get_friends`, `get_pending_requests`, `get_sent_requests` Supabase에 직접 실행
- 화면 동작 확인 완료 (내 크루 / 받은 요청 / 보낸 요청 / 수락·거절·취소·삭제 액션)
- 개발 환경 WSL2(Ubuntu)로 전환 완료
- 검증 완료
  - `npm run lint` 통과
  - `npm run build` 통과

## 2026-05-21

### 완료
- 유저 연결 모델 전환 (`user_likes` → `user_connections`)
  - `user_connections` 테이블 신규 (`requester_id`, `receiver_id`, `status: pending/accepted/rejected`)
  - `send_friend_request`, `accept_friend_request`, `reject_friend_request`, `remove_friend`, `get_connection_status` RPC 생성
  - `trg_notify_friend_request` 트리거 (신청/수락 알림)
  - `notifications` type CHECK 제약에 `friend_request`, `friend_accepted` 추가
  - `users` 테이블에 `credit_balance`, `level`, `level_score` 컬럼 추가 (크레딧/레벨 시스템 대비)
- 프로필 페이지 친구 시스템 UI 적용
  - 상태별 버튼 분기 (`none` / `pending` / `accepted`)
  - 친구 수 표시 및 낙관적 업데이트/실패 롤백 처리
- 알림 타입 전환
  - `user_like` 제거
  - 알림 패널 친구 신청/수락 문구 추가

## 2026-04-27

### 완료
- 서비스 방향 확정 (팀빌딩 krew → 대학생 실명 SNS UniVerse 피봇)
- 기획안 v1.0 작성
- 프로토타입 화면 확인 (localhost:5173 — 모바일/웹 뷰)
- 기술 스택 확정
  - Web: Next.js 14 + TypeScript + Tailwind CSS + Supabase + Vercel
  - App (예정): Expo (React Native)
- `C:\dev\univer` 프로젝트 생성 + GitHub 레포 초기 커밋
- 문서 세팅 완료 (AGENTS.md, CLAUDE.md, docs/ 전체)
- Notion 문서 구조 세팅 (PRD, 로드맵, DB 스키마, 의사결정 로그, 작업 일지)
- Supabase universe 프로젝트 생성 + 환경변수 설정
- DB 스키마 설계 완료 (총 23개 테이블)
- 화면 구조 확정 (모바일/웹 레이아웃, 라우팅)
- 개발 단계 순서 확정 (SNS → 채팅 → 커뮤니티 → 앱전환 → 부가기능)
- 메인 화면 껍데기 구현
  - `src/components/layout/Header.tsx` 추가 (모바일 전용: 로고, 알림, 채팅)
  - `src/components/layout/BottomTabBar.tsx` 추가 (모바일 전용: 홈, 검색, 글쓰기, 카테고리, 프로필)
  - `src/components/layout/SideBar.tsx` 추가 (웹 전용: 로고, 홈, 검색, 카테고리, 프로필, 채팅, 알림)
  - `src/app/(main)/layout.tsx` 추가 (모바일/웹 반응형 메인 레이아웃)
  - `src/app/(main)/page.tsx` 추가 (빈 피드 상태)
  - 기존 `src/app/page.tsx` 제거 후 메인 라우트를 `(main)` 그룹으로 이동
- 검증 완료
  - `npm run lint` 통과
  - `npm run build` 통과
- 학교 이메일 인증 기본 흐름 구현
  - `@supabase/ssr`, `@supabase/supabase-js` 설치
  - `src/lib/supabase/browser.ts` 추가 (브라우저용 Supabase 클라이언트)
  - `src/lib/supabase/server.ts` 추가 (server component / route handler용 클라이언트)
  - `src/features/auth/api.ts` 추가
    - 이메일 도메인 추출
    - `universities` 조회
    - 매직링크 발송
    - `users.is_onboarded` 조회
  - `src/middleware.ts` 추가
    - 비로그인 유저 ` /auth/login ` 리다이렉트
    - 로그인 + 미온보딩 유저 ` /onboarding ` 리다이렉트
    - `/auth/*`, `/onboarding` 예외 처리
  - `src/app/(auth)/auth/login/page.tsx` + `LoginForm.tsx` 추가
    - 학교 이메일 입력
    - 등록된 도메인만 매직링크 발송
    - 미등록 도메인 에러 표시
  - `src/app/(auth)/auth/callback/route.ts` 추가
    - 매직링크 코드 교환
    - 온보딩 여부에 따라 `/` 또는 `/onboarding` 이동
  - `src/app/onboarding/page.tsx` 추가 (임시 placeholder)
- 로그인 방식 조정
  - `signInWithOtp`에 `shouldCreateUser: true` 추가
  - `emailRedirectTo`를 `http://localhost:3000/auth/callback`으로 고정
  - Confirm email이 꺼진 환경에서 비밀번호 없이 즉시 로그인 가능한 OTP 흐름으로 조정
- 개발 환경 미들웨어 인증 체크 임시 비활성화
  - `src/middleware.ts`에서 `NODE_ENV === 'development'`면 인증/온보딩 체크 없이 통과
  - 프로덕션 환경에서는 기존 인증 체크 유지
- 웹 사이드바 게시물 작성 버튼 추가
  - `src/components/layout/SideBar.tsx` 하단에 `+ 새 게시물` 버튼 추가
  - 클릭 시 `/posts/write`로 이동하도록 메인 레이아웃에서 props 전달
- 스토리바 컴포넌트 추가
  - `src/components/story/StoryItem.tsx` 추가 (아바타, 이름, viewed 상태별 테두리)
  - `src/components/story/StoryBar.tsx` 추가 (가로 스크롤 목록, 첫 슬롯 `내 스토리`)
  - `src/app/(main)/page.tsx` 상단에 스토리바 배치
- 스토리바 더미 데이터 제거
  - `src/app/(main)/page.tsx`의 하드코딩 스토리 배열 제거
  - `StoryBar`는 `stories` props만 받아 렌더링하고, 빈 배열이면 `내 스토리`만 표시
  - 실제 스토리 데이터는 추후 `features/story/api.ts`에서 주입 예정
- 스토리바 `내 스토리` 버튼 링크화
  - `src/components/story/StoryBar.tsx`의 `MyStoryItem`을 `Link`로 변경
  - 클릭 시 `/story/create`로 이동하고 클릭 커서를 표시하도록 수정
- 게시물 이미지 업로더 컴포넌트 추가
  - `src/components/feed/PostImageUploader.tsx` 추가
  - 다중 사진 선택, 최대 10장 제한, 선택 이미지 미리보기, 삭제 버튼 구현
  - `images` / `onImagesChange` props만으로 동작하도록 구성
- 게시물 작성 페이지 추가
  - `src/app/(main)/posts/write/page.tsx` 추가
  - 상단 헤더, 이미지 업로더, 내용 textarea, 공개 범위 토글, 해시태그 입력 UI 구현
  - 게시 버튼 클릭 시 `{ images, content, visibility, hashtags }`를 `console.log`로 출력
- 게시물 작성 저장 로직 연결
  - `src/features/feed/api.ts` 추가
  - `post-images` Storage 업로드, `posts` / `post_images` / `post_hashtags` 저장 로직 구현
  - 현재 로그인 유저의 `university_id` 조회 후 게시물 저장하도록 연결
  - 미로그인/학교 정보 없음/저장 실패 시 에러 처리 추가
  - 게시 중 로딩 상태 표시, 저장 완료 후 `/`로 이동
  - 공개 범위 UI는 화면에서 숨기고 `visibility`는 현재 `public`으로 고정
- 인증/온보딩 비밀번호 기반 흐름으로 전환
  - `src/app/(auth)/auth/login/page.tsx`, `LoginForm.tsx` 수정
  - 매직링크 UI 제거 후 이메일 + 비밀번호 로그인(`signInWithPassword`)으로 변경
  - 로그인 성공 시 `/` 이동, `/auth/signup` 링크 추가
  - `src/app/(auth)/auth/signup/page.tsx`, `SignupForm.tsx` 추가
  - 국민대 이메일(`kookmin.ac.kr`) 검증 후 `signUp`으로 회원가입, 성공 시 `/onboarding` 이동
  - `src/app/onboarding/page.tsx` 수정
  - 닉네임/학과 입력, `users` 테이블 `nickname`, `department`, `is_onboarded=true` 업데이트 후 `/` 이동
  - 인증/온보딩 로직을 `src/features/auth/api.ts`로 정리
- 미들웨어 인증 체크 재활성화
  - `src/middleware.ts`의 개발 환경 우회 코드 제거
  - 비로그인 유저는 `/auth/login`으로 리다이렉트
  - 로그인 완료 + 미온보딩 유저는 `/onboarding`으로 리다이렉트
  - 예외 경로는 `/auth/login`, `/auth/signup`, `/auth/callback`, `/onboarding`만 유지
- 피드 조회 API 1차 추가
  - `src/features/feed/api.ts`에 `getFeed` 함수 추가
  - 현재 로그인 유저의 `university_id` 기준으로 `posts`를 최신순 조회
  - `users`, `post_images`, `post_hashtags`, `hashtags` 데이터를 배치 조회해 `FeedPost[]` 형태로 조립
  - `deleted_at IS NULL`, 기본 `limit=20`, `created_at` 커서 기반 `nextCursor` 반환 처리
- 피드 게시물 카드 컴포넌트 추가
  - `src/components/feed/PostCard.tsx` 추가
  - 아바타/닉네임/학과/상대 시간/더보기 버튼을 포함한 카드 헤더 구현
  - 이미지 스와이프 영역과 페이지 인디케이터 구현
  - 좋아요/댓글/북마크 버튼과 카운트, 본문, 해시태그 표시 구현
  - 실제 동작은 props 콜백만 연결하고 Supabase 쿼리는 포함하지 않음
- 피드 목록 컴포넌트 추가
  - `src/components/feed/FeedList.tsx` 추가
  - `PostCard` 목록 렌더링, 빈 상태 문구, 로딩 스켈레톤 UI 구현
  - 실제 데이터 조회 없이 props만 받아 동작하도록 구성
- 메인 피드 페이지 연결
  - `src/app/(main)/page.tsx`를 client component로 전환
  - `getFeed()` 호출 후 `FeedList`에 `posts`, `isLoading` 전달
  - 좋아요/댓글/북마크 액션은 임시로 `console.log` 콜백 연결
  - 피드 조회 실패 시 에러 메시지 표시하도록 처리
- 피드 이미지/웹 사이드바 레이아웃 보정
  - `src/components/feed/PostCard.tsx`의 이미지 영역을 정사각형 비율로 유지하면서 최대 크기를 제한
  - 이미지에 `object-cover`를 유지하고 카드 안에서 가운데 정렬되도록 조정
  - `src/components/layout/SideBar.tsx`를 `justify-between` 구조로 변경해 메뉴는 상단, `+ 새 게시물` 버튼은 하단에 고정
- 메인 피드 디자인 밀도 조정
  - `src/app/(main)/layout.tsx`의 전체 배경을 흰색으로 통일하고 피드 최대 폭을 약 470px로 축소
  - 메인 레이아웃과 우측 패널의 경계선 성격 요소를 제거해 화면을 단순화
  - `src/components/feed/PostCard.tsx`에서 이미지 좌우 패딩과 둥근 모서리를 제거하고 카드 폭 전체를 쓰는 1:1 이미지로 조정
  - `src/components/story/StoryBar.tsx`의 배경을 흰색으로 유지하고 구분선을 제거
- 웹 사이드바 고정 처리
  - `src/components/layout/SideBar.tsx`에 `sticky`, `top-0`, `h-screen` 기준 레이아웃을 적용
  - 피드 스크롤 시에도 사이드바는 화면 왼쪽에 고정되도록 조정

### 주요 결정사항
- 친한친구 기능 추가 (일방적, close_friends 테이블)
- 게시물/스토리 visibility: 'public' | 'close_friends'
- 채팅이 커뮤니티보다 우선 (2단계)
- 커뮤니티 댓글 별도 테이블 (community_comments)
- 모바일 하단 탭: 홈 | 검색 | + | 카테고리 | 프로필
- 채팅/알림은 헤더 우측 아이콘으로
- 도구별 역할 분담 확정 (Claude: 문서/설계, Claude Code: 구현, Codex: 리뷰)

### 다음 작업
- [ ] DB 마이그레이션 파일 작성 (1단계 17개 테이블)
- [ ] Supabase 마이그레이션 적용
- [ ] 온보딩 페이지 구현 (학교, 학과, 닉네임 저장)
- [ ] 가입 시 `users.university_id`를 실제 이메일 도메인 기준으로 반영하도록 보완
- [ ] 피드 기능 설계 및 `features/feed` 구조 초안 작성

## 2026-04-28

### 완료
- PostCard 이미지 슬라이드 좌우 화살표 추가
  - `src/components/feed/PostCard.tsx`에서 이미지가 2장 이상일 때만 이전/다음 버튼 표시
  - 첫 이미지에서는 왼쪽 버튼, 마지막 이미지에서는 오른쪽 버튼을 숨기도록 처리
  - 버튼 클릭 시 현재 카드 폭 기준으로 이전/다음 이미지로 부드럽게 이동
- 메인 피드 무한 스크롤 구현
  - `src/app/(main)/page.tsx`에서 `posts`, `nextCursor`, `isLoadingMore` 상태를 관리하고 `IntersectionObserver`로 다음 페이지 자동 로드
  - `src/features/feed/api.ts`의 기본 조회 개수를 테스트용 3개로 임시 조정하고 복구 TODO 주석 추가
  - `src/components/feed/FeedList.tsx`에 추가 로딩 표시(`더 불러오는 중...`) props 연결
- 메인 피드 화면 연결 완료
  - `src/app/(main)/page.tsx`에서 `getFeed()` 호출 후 `FeedList`로 데이터 전달
  - 로딩 상태, 에러 메시지, 좋아요/댓글/북마크 임시 `console.log` 콜백 연결
- 피드 레이아웃 및 카드 크기 조정
  - `src/app/(main)/layout.tsx`의 메인 피드 최대 폭을 약 470px로 축소
  - `src/components/feed/PostCard.tsx` 이미지 영역을 카드 폭 전체를 쓰는 1:1 비율로 조정
  - `src/components/story/StoryBar.tsx` 구분선 제거 및 배경 단순화
- 웹 사이드바 고정 및 작성 버튼 위치 보정
  - `src/components/layout/SideBar.tsx`를 `justify-between` 구조로 변경
  - `+ 새 게시물` 버튼이 항상 하단에 보이도록 수정
  - 사이드바에 `sticky`, `top-0`, `h-screen`을 적용해 스크롤 시에도 고정되도록 조정
- 운영 문서 및 코드 주석 정리
  - `docs/PLAN.md`, `docs/ARCHITECTURE.md`, `docs/WORKLOG.md` 최신 상태 반영
  - 피드/레이아웃/미들웨어 관련 핵심 파일에 역할 및 주요 로직 주석 추가
- 인증/스토리/Supabase 유틸 주석 보강 및 전체 정리
  - `src/app/(auth)/`, `src/app/(main)/`, `src/app/onboarding/` 하위 주요 페이지에 한국어 주석 추가
  - `src/components/feed/PostImageUploader.tsx`, `src/components/story/` 전체에 props/역할/핵심 흐름 주석 추가
  - `src/features/auth/api.ts`, `src/lib/supabase/`, `src/types/database.types.ts`, `src/middleware.ts` 주석 보강
  - 전체 변경분 기준으로 문서 동기화 후 커밋/푸시 준비

## 2026-05-09

### 완료
- 댓글 바텀시트 UI 및 피드 연결
  - `src/components/feed/CommentSheet.tsx` 신규 추가
  - 댓글 목록/작성/삭제 UI와 로딩/빈 상태 처리
  - 메인 피드 댓글 버튼 클릭 시 바텀시트 열기 및 댓글 수 즉시 동기화
- 댓글 API 1차 구현
  - `src/features/comments/api.ts` 신규 추가
  - `getComments`, `createComment`, `deleteComment` 구현
  - 댓글 작성/삭제 시 `posts.comments_count` 증감 처리 및 soft delete 적용
- `database.types.ts` 수동 교체 및 `post_likes` 타입 정상화
  - `src/types/database.types.ts`에 `post_likes` 포함 최신 public 스키마 타입 반영
  - `src/features/feed/api.ts`의 post_likes 타입 우회 코드 제거
  - `togglePostLike`, `getLikedPostIds`를 `supabase.from("post_likes")` 직접 호출로 정리
- 게시물 좋아요 토글 기능 구현
  - `src/features/feed/api.ts`에 `togglePostLike`, `getLikedPostIds` 추가
  - 메인 피드에서 좋아요 상태를 초기 조회하고 낙관적 업데이트 후 서버 응답으로 동기화
  - `PostCard` 하트 아이콘을 좋아요 여부에 따라 채움/비움으로 표시
- Supabase 프로젝트 복구 (INACTIVE → ACTIVE)
- AGENTS.md 업데이트 (Next.js 16, Supabase 프로젝트 ID, 현재 진행상황 반영)
- 노션 로드맵 업데이트 (관리자 페이지 설계 추가, Sprint 계획 갱신)
- 무한 스크롤 구현 (IntersectionObserver + cursor 페이지네이션 + isLoadingMore 상태, 테스트용 limit=3)
- PostCard 이미지 슬라이드 화살표 버튼 추가 (2장 이상일 때만 표시, 첫/마지막에서 해당 방향 숨김, smooth 스크롤)

### 주요 결정사항
- 관리자 페이지 MVP에 포함 (비개발자 UI, 전체 학교 조회)
- 이미지 처리/최적화는 배포 전 일괄 처리
- 사진 비율 선택은 추후 추가

## 2026-05-10

### 완료
- 대댓글 1단계 중첩 기능 구현
  - `comments.deleted_at` 제거에 맞춰 댓글 API를 hard delete 방식으로 변경
  - `getComments`가 부모 댓글 최신순, 대댓글 오래된순 중첩 구조를 반환하도록 수정
  - `CommentSheet`에 답글 보기 토글, 답글 대상 표시/취소, 대댓글 작성/삭제/좋아요 UI 연결
- 댓글 좋아요 기능 구현
  - `src/types/database.types.ts`의 `comments` 타입에 `likes_count` 반영
  - `src/features/comments/api.ts`에 `toggleCommentLike`, `getLikedCommentIds` 추가
  - `src/components/feed/CommentSheet.tsx`에서 댓글 좋아요 상태 조회, 하트 UI, 낙관적 업데이트 및 실패 롤백 처리

## 2026-05-10

### 완료
- 성능 인덱스 6개 Supabase에 추가
  - idx_comments_post_id (댓글 게시물별 조회)
  - idx_post_images_post_id (이미지 게시물별 조회)
  - idx_posts_university_created (피드 학교별 최신순)
  - idx_posts_user_created (프로필 유저별 최신순)
  - idx_post_likes_target_id (좋아요 목록 게시물별)
  - idx_notifications_user_created (알림 유저별 최신순)
- 댓글 좋아요 기능 구현
  - toggleCommentLike, getLikedCommentIds 추가 (features/comments/api.ts)
  - 모든 댓글에 하트 + likes_count 표시 (본인 댓글도 포함)
  - 낙관적 업데이트 + 실패 시 롤백
- 대댓글 구현
  - 1단계 중첩 구조 (대댓글에 대댓글 없음)
  - 답글 달기 버튼 + @닉네임 자동 입력
  - 답글 N개 보기/숨기기 토글
  - 대댓글도 좋아요/삭제 가능
- 댓글 hard delete로 전환
  - deleted_at 컬럼 제거
  - 부모 댓글 삭제 시 대댓글 cascade 삭제
  - comment_likes cascade 삭제
- 댓글 UI 개선
  - 댓글 간격 축소
  - 대댓글 왼쪽 세로 막대기 제거
  - 답글 숨기기 버튼 대댓글 아래로 이동
- 본문 더보기/접기 버튼 구현 (PostCard.tsx)
  - 2줄 초과 시 말줄임 + ...더보기 버튼 표시
  - 펼친 상태에서 접기 버튼 표시
  - 본문 텍스트 색상 text-zinc-950으로 변경

### 트러블슈팅
- comments UPDATE RLS 정책 누락 → likes_count 업데이트 실패 → 정책 추가
- hard delete 전환 시 deleted_at 참조 RLS 정책 충돌 → 정책 재설계

### 다음 작업
- [ ] PostCard ... 버튼 메뉴 (본인: 수정/삭제 / 타인: 신고/차단)
- [ ] 좋아요 목록 모달
- [ ] 스토리
- [ ] 프로필 페이지
- [ ] 관리자 페이지

## 2026-05-11

### 완료
- 게시물 수정 모드 구현
  - `/posts/write?postId=...` 진입 시 기존 게시물 content, hashtags, images 조회
  - 수정 모드 타이틀을 `게시물 수정`으로 변경
  - 기존 이미지는 읽기 전용으로 표시하고 사진 수정은 비활성화
  - content, hashtags만 업데이트하도록 `updatePost` 연결
- 게시물 상세 조회 API 추가
  - `getPost(postId)`로 수정 화면에 필요한 content, hashtags, images 반환
  - 해시태그 저장/교체 로직을 공통 함수로 정리

## 2026-05-11

### 완료
- 시스템 폰트 적용 (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Noto Sans KR)
- PostCard ... 버튼 메뉴 구현
  - ActionSheet 공용 컴포넌트 신규 생성 (src/components/common/ActionSheet.tsx)
  - 본인 게시물: 수정 / 삭제 / 링크 복사 / 취소
  - 타인 게시물: 신고 / 차단 / 링크 복사 / 취소
  - 신고/차단은 console.log (추후 구현)
- 게시물 수정 모드 구현
  - getPost, updatePost 함수 추가 (features/feed/api.ts)
  - /posts/write?postId=xxx 수정 모드 분기
  - 기존 내용/해시태그 미리 채워짐, 사진은 읽기 전용
- 게시물 삭제 구현 (soft delete)
  - deletePost 함수 추가 (features/feed/api.ts)
  - 삭제 후 피드에서 즉시 제거
- 토스트 메시지 컴포넌트 구현 (src/components/common/Toast.tsx)
  - 하단 중앙 고정, 3초 후 자동 사라짐
  - success/error 두 가지 타입
- 토스트 PostCard 연결
  - 삭제 성공/실패, 링크 복사 시 토스트 표시
- 게시물 작성/수정 완료 토스트 (피드에서 표시)
  - 작성/수정 완료 후 쿼리 파라미터로 피드에 전달
  - 피드 page.tsx에서 토스트 표시 후 URL 정리
- 스토리 작성 1차 구현
  - story-images Storage 업로드 API 추가 (features/stories/api.ts)
  - stories 테이블 insert 및 24시간 expires_at 설정
  - /story/create 페이지 추가 (사진 1장 선택, 세로 미리보기, 공유하기)
  - 공유 완료 후 피드에서 "스토리가 공유됐습니다" 토스트 표시
- 스토리바 실제 데이터 조회 연결
  - `getStories` 추가 (같은 학교, 만료 전, 삭제되지 않은 스토리 조회)
  - 유저별 스토리 그룹핑 및 `story_views` 기반 `hasUnviewed` 계산
  - 본인 스토리 우선 표시, StoryBar 내부 조회 및 `/story/[userId]` 이동 연결
- 스토리 뷰어 구현
  - `getUserStories`, `recordStoryView`, `getStoryViewers` 추가 (features/stories/api.ts)
  - `/story/[userId]` 전체화면 뷰어 추가 (5초 자동 진행, 진행 바, 좌우 이동, 닫기)
  - 타인 스토리 진입 시 `story_views` 기록 및 조회수 증가
  - 본인 스토리에서 조회자 수와 조회자 목록 바텀시트 표시
- 토스트 메시지 컴포넌트 구현 (src/components/common/Toast.tsx)
- 토스트 PostCard/피드 연결 (삭제/링크복사/수정완료/작성완료)
- 스토리 업로드 구현 (src/app/(main)/story/create/page.tsx)
- 스토리 API 구현 (src/features/stories/api.ts)
  - uploadStoryImage, createStory, getStories, getUserStories
  - recordStoryView, toggleStoryLike, getMyStoryLikedStatus
  - getStoryViewers (조회자별 isLiked 포함), deleteStory
- 스토리바 구현 (StoryBar.tsx 수정)
- 스토리 뷰어 구현 (src/app/(main)/story/[userId]/page.tsx)
  - 9:16 비율, 블러 배경, 5초 자동 넘김, 일시정지
  - 진행바, 화살표 네비게이션
  - 본인: 조회수 + 조회자 바텀시트 (좋아요 여부 포함)
  - 타인: 하트 좋아요 버튼
  - X 버튼 화면 우측 상단, ... 버튼 (본인: 삭제 / 타인: 신고)

### 트러블슈팅
- posts UPDATE 정책 with_check 누락 → 삭제 실패 → 수정
- posts SELECT 정책 deleted_at IS NULL 조건이 soft delete UPDATE 차단 → 본인 게시물은 deleted_at 무관하게 SELECT 가능하도록 정책 수정
- stories UPDATE RLS 정책 with_check 누락 → 수정
- 스토리 비율/블러배경 렌더링 수정 여러 차례

### 다음 작업
- [ ] 토스트 메시지 PostCard 연결 완료
- [ ] 좋아요 목록 모달
- [ ] 스토리
- [ ] 프로필 페이지
- [ ] 관리자 페이지

## 2026-05-12

### 완료
- stories SELECT RLS 정책 수정 (soft delete 호환 — 본인 스토리는 deleted_at 무관 SELECT 가능)
- 스토리 삭제 확인 다이얼로그 구현 (ConfirmDialog 공용 컴포넌트 신규)
  - ActionSheet → ConfirmDialog 2단계 흐름
  - 게시물 삭제/로그아웃/신고에도 재사용 예정
- ActionSheet/ConfirmDialog/ViewerSheet 열릴 때 스토리 타이머 멈춤, 닫을 때 재개
- 스토리 뷰어 종료 시 refreshStories 파라미터로 StoryBar 새로고침
- users 테이블 bio 컬럼 추가 (프로필 소개글)
- users 테이블 nickname UNIQUE 제약 추가
- database.types.ts bio 컬럼 반영

### 트러블슈팅
- stories soft delete 시 SELECT 정책 위반으로 403 발생 → posts와 동일한 패턴으로 정책 수정
- users RLS 활성화 시도 → 재귀 문제로 일시 롤백, 배포 전 재설계 필요

### 다음 작업
- [ ] 온보딩 닉네임 중복 체크 추가
- [ ] 프로필 페이지 /profile/[nickname]
- [ ] 프로필 편집 페이지 (닉네임/소개/프로필사진 + 로그아웃)
- [ ] 사이드바/탭바 프로필 버튼 연결

## 2026-05-16

### 완료
- users 테이블 bio, real_name 컬럼 추가
- users 테이블 nickname UNIQUE 제약 추가
- database.types.ts bio, real_name 반영
- feed/api.ts users select 불필요한 컬럼 제거 (id, nickname, department, avatar_url 4개만)
- auth/api.ts getCurrentUserProfile real_name, bio select 추가
- 프로필 페이지 구현 (/profile/[nickname])
  - getProfile, getProfilePosts, getPostsCount (features/profile/api.ts 신규)
  - 프로필 헤더, 게시물 3열 그리드, 본인/타인 분기
  - /profile/me 자동 리다이렉트
- NavItems 컴포넌트 신규 생성 (클라이언트 컴포넌트로 분리)
  - usePathname()으로 현재 경로 감지, 사이드바/탭바 활성화 표시
- 사이드바 border-r 제거
- lucide-react 설치 및 아이콘 적용
  - 알림: Bell 아이콘
  - 메시지: MessageCircleMore 아이콘
  - 채팅 → 메시지로 명칭 변경
- Avatar 공용 컴포넌트 신규 생성 (src/components/common/Avatar.tsx)
  - 회색 실루엣 기본 이미지, xs/sm/md/lg/xl 5가지 사이즈
  - 피드/댓글/스토리바/스토리뷰어/프로필 전체 적용
- 사이드바/탭바 프로필 아이콘 → 본인 프로필 사진으로 변경

### 트러블슈팅
- lucide-react를 서버 컴포넌트(layout.tsx)에서 import 시 createContext 에러 → 클라이언트 컴포넌트(NavItems.tsx)로 이동
- users RLS 활성화 시도 → 재귀 문제로 롤백
- gmail 계정에 국민대 닉네임이 저장된 문제 → 세션 꼬임으로 발생, DB 직접 수정

### 다음 작업
- [ ] 회원가입 플로우 재설계 (이메일 → 인증 → 비밀번호+닉네임+이름+학과)
- [ ] 온보딩 닉네임 중복 체크
- [ ] 프로필 편집 페이지 (닉네임/소개/프로필사진 + 로그아웃)
- [ ] 스토리 UI/UX 개선
- [ ] 좋아요 목록 모달
- [ ] 관리자 페이지

## 2026-05-18

### 완료
- 프로필 편집 페이지 구현 (src/app/(main)/profile/edit/page.tsx 신규)
  - 프로필 사진 변경 (avatars 버킷 업로드, 카메라 아이콘 오버레이)
  - 닉네임 수정 (대소문자 입력 허용, 저장 시 소문자 변환)
  - 닉네임 실시간 중복 체크 (debounce 300ms, 본인 닉네임 제외)
  - 소개(bio) 수정 (최대 150자)
  - 학과 표시만 (수정 불가)
  - 프로필 편집 버튼 연결 (/profile/edit으로 이동)
- features/profile/mutations.ts 신규 생성
  - updateProfile, checkNicknameDuplicate, uploadAvatar 함수
  - features/profile/api.ts에서 분리
- features/auth/api.ts에 signOut() 추가
- 전체 button 태그에 cursor-pointer 전역 적용 (globals.css)
- 프로필 편집 버튼 UI 수정 (검은색 → 회색 테두리)
- 설정 페이지 신규 (/settings)
  - ChevronLeft 뒤로가기, 프로필 편집 이동, 공지사항/문의하기 비활성, 로그아웃 ConfirmDialog
- 헤더 이중 렌더링 버그 수정
  - `(sub)` route group 분리 → `/settings`, `/profile/edit`에서 UNIVER 헤더 제거
  - 스크롤 시 헤더 침범 현상 해결
- 프로필 페이지 설정 아이콘(톱니바퀴) 추가 → /settings 이동
- 프로필 편집 로그아웃 버튼 제거
- 게시물 상세 모달 구현 (PostDetail.tsx + Intercepting Routes)
  - `@modal/(.)posts/[postId]` — 프로필/피드에서 모달
  - `(sub)/posts/[postId]` — 직접 URL 접근 시 풀페이지
  - 웹 좌우 2단, 인스타 방식 (본문+댓글 스크롤, 좋아요+입력 하단 고정)
  - 피드 댓글 버튼 → PostDetail 모달 연결
- 피드 이미지 원본 비율로 변경 (PostCard.tsx)
  - aspect-square 제거, object-contain, 배경 검정
  - 프로필 썸네일 1:1 유지
- UserInfo 공용 컴포넌트 신규 (`src/components/common/UserInfo.tsx`)
  - 아바타 + 닉네임 → `/profile/${nickname}` Link
  - PostCard, PostDetail, CommentSheet, PostDetail CommentsList 적용
- 학과(department) 표시 주석 처리

### 주요 결정
- 로그아웃 버튼을 프로필 편집에서 설정 페이지로 이동 (B안)
  - 프로필 페이지 설정 아이콘(톱니바퀴)에서 /settings로 이동
  - /settings 페이지에 로그아웃 포함

### 다음 작업
- [ ] 관리자 페이지 (/admin)
- [ ] 회원가입 플로우 재설계
- [ ] 스토리 UI/UX 개선
- [ ] 좋아요 목록 모달

## 2026-05-19

### 완료
- 게시물 작성 페이지 경로 변경
  - 기존 `src/app/(main)/posts/write/page.tsx`를 유지한 채 `src/app/(sub)/write/page.tsx` 신규 생성
  - 게시물 작성/수정 진입 경로를 `/posts/write`에서 `/write`로 변경
  - PostCard, PostDetail 수정 액션 및 NavItems 작성 버튼 링크를 `/write`로 연결
- 메인 피드 컬럼 폭 되돌림
  - `src/app/(main)/layout.tsx`의 피드 컬럼을 `max-w-[630px]`에서 `max-w-[470px]`로 복구
  - 우측 패널 `w-72` 조정은 유지
- 모달 내 UserInfo 링크 클릭 시 모달 자동 닫힘 처리
  - `@modal/(.)posts/[postId]/page.tsx`에 `usePathname` 추가
  - `pathname`이 `/posts/${postId}`와 다르면 `null` 반환 → 다른 경로 이동 시 모달 자동 언마운트
- 회원가입 후 자동 로그인 처리
  - `signUpWithPassword` 완료 후 `signInWithPassword` 자동 호출
  - 이메일 인증 비활성화 상태에서 세션 미생성 문제 해결
- 온보딩 완료 후 홈 이동
  - `router.replace("/") + router.refresh()` → `window.location.href = "/"` 로 변경
- 사이드바 프로필 활성화 조건 수정
  - 내 닉네임 기준 정확히 일치할 때만 활성화, 남의 프로필에서는 비활성화
- 스토리바 내 스토리/스토리 링 UI 수정
  - `MyStoryCreateItem`의 "나" 텍스트를 현재 유저 아바타로 교체
  - `getCurrentUserProfile()`로 현재 유저 프로필 조회 후 Avatar fallback 포함 적용
  - 미확인 스토리는 인스타 스타일 그라데이션 링으로 변경
  - 확인한 스토리는 기존 회색 링 유지
  - 내 스토리 생성 아이템은 내 스토리가 있을 때 회색 링, 없을 때는 링 없이 아바타만 표시
  - 내 스토리 그룹은 목록에서 제외해 중복 렌더링 제거
  - 내 스토리가 있을 때는 아바타 원은 `/story/[userId]`, + 버튼은 `/story/create`로 클릭 동작 분리

### 기타
- Supabase 이메일 인증 비활성화 (개발 편의, 배포 전 재활성화 필요)
- `simsim020304@kookmin.ac.kr` 계정 수동 `email_confirmed_at` 처리

## 2026-05-20

### 완료
- 알림 actor 닉네임 표시 보정
  - `notifications.reference_id`와 타입별 원본 테이블을 기준으로 actor 역추적 로직 수정
  - 게시물 좋아요/스토리 좋아요/댓글 좋아요/게시물 댓글/유저 좋아요 알림에서 실제 닉네임 표시
- 프로필 유저 좋아요 기능 추가
  - `features/profile/api.ts`에 `toggleUserLike`, `getUserLikeStatus` RPC 래퍼 추가
  - `database.types.ts`에 `toggle_user_like`, `get_user_like_status` RPC 타입 반영
  - 프로필 페이지 타인 헤더에 하트 아이콘 + 좋아요 수 표시
  - 유저 좋아요 토글 낙관적 업데이트 및 실패 시 롤백 적용
- 게시물 미디어 테이블 전환 반영
  - Supabase `post_images` 테이블을 `post_media`로 교체한 스키마를 `database.types.ts`에 반영
  - `post_images` → `post_media` 전환 및 reports 정비 마이그레이션 추가
  - `features/feed/api.ts`의 `PostImage` 타입을 `PostMedia`로 변경하고 `media` 필드로 반환하도록 수정
  - 게시물 생성/피드/상세 조회 쿼리를 `post_media` 기준으로 변경
  - PostCard, PostDetail, 게시물 작성/수정 화면, 프로필 썸네일 조회를 새 미디어 구조에 맞게 수정
- 신고 API 연결
  - `features/reports/api.ts` 신규 생성 (`createReport`)
  - `reports` 타입을 현재 DB 스키마에 맞게 반영
  - 피드/게시물 상세 신고와 스토리 신고 ActionSheet를 실제 reports insert로 연결
  - 신고 전 ConfirmDialog 확인 절차와 완료/실패 Toast 피드백 추가
- 게시물 상세 데스크톱 모달 레이아웃 버그 수정
  - 모달 높이를 96vh, 최대 폭을 1100px로 조정하고 우측 댓글 컬럼을 500px 고정
  - 좌측 이미지 영역을 600px 이하로 제한하고 현재 이미지 비율에 맞춰 폭 계산
  - 우측 댓글 스크롤 영역과 하단 입력창 분리로 댓글이 없을 때도 입력창 고정
- 게시물 상세 댓글 기능 복구
  - 댓글 좋아요, 대댓글 표시, 답글 보기/숨기기, 답글 달기 입력 흐름 복구
  - `toggleCommentLike`, `getLikedCommentIds` 기반 낙관적 업데이트와 실패 롤백 적용
- 게시물 상세 컴포넌트 파일 분리
  - `ImageCarousel`, `PostComments`, `PostDetailParts`, `lib/utils/time`으로 코드 이동
  - 기능/로직/스타일 변경 없이 `PostDetail.tsx` 본체만 남기도록 정리
- 알림 시스템 UI 구현
  - `features/notifications/api.ts` 신규 생성 (`getNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`)
  - `notifications` 타입을 현재 알림 종류(`post_like`, `story_like`, `comment_like`, `post_comment`, `report_received`)에 맞게 반영
  - 웹 사이드바 벨 클릭 시 360px 알림 패널 표시, 바깥 클릭 닫기, 모두 읽음/단건 읽음 처리 연결
  - 모바일 `/notifications` 페이지 신규 생성
  - Header/NavItems 벨 아이콘에 읽지 않은 알림 빨간 점 뱃지 추가
  - 알림 항목에 actor 아바타, 알림 문구, 상대 시간, 게시물/스토리 썸네일, 클릭 이동 처리 적용
- 관리자 페이지 1차 구현
  - `middleware.ts`에 `/admin` 접근 시 `users.role = 'admin'` 검사 추가, 비관리자는 `/`로 리다이렉트
  - `features/admin/api.ts` 신규 생성 (`getDashboardStats`, `getAdminReports`, `getAdminUsers`, `handleReport`)
  - `/admin` 전용 레이아웃과 좌측 사이드바 구현
  - `/admin` 대시보드 구현 (일/월/년/전체 탭, 신규가입/게시물/스토리/댓글/좋아요/미처리신고 KPI 카드, 새로고침)
  - `/admin/reports` 구현 (목록 조회, 기각/삭제/복구 처리, 상태별 버튼 분기, 처리 후 새로고침)
  - `/admin/users` 구현 (닉네임/이메일 검색, 가입일/게시물 수/신고당한 횟수/권한 뱃지 표시)
  - 사이드바 하단에 관리자 전용 버튼 추가 (`role='admin'`일 때만 노출)
- 신고 시스템 개선
  - `reports.target_snapshot` 컬럼 추가 (신고 시점 콘텐츠 스냅샷 자동 저장)
  - `reports.target_author_id` 컬럼 추가 (콘텐츠 삭제 후에도 작성자 보존)
  - 콘텐츠 삭제 방식을 hard delete에서 soft delete로 전환해 복구 가능하도록 조정
  - `trg_fill_report_snapshot` 트리거 추가
- 알림 시스템
  - `post_like`, `story_like`, `comment_like`, `post_comment`, `report_received` 알림 트리거 5종 연결
  - `NotificationPanel` 웹 슬라이드 패널 구현
  - 모바일 `/notifications` 페이지 구현
  - 벨 아이콘 읽지 않은 알림 수 뱃지 표시
- 회원가입 이메일 인증 흐름 조정
  - `signUpWithPassword`에 `emailRedirectTo=/auth/callback` 추가
  - 회원가입 직후 자동 로그인 제거
  - 회원가입 성공 시 인증 메일 발송 완료 화면으로 전환
- 계정 탈퇴 및 복구 기능 구현
  - `delete_account` RPC 연동
  - 설정 페이지에 탈퇴 확인 다이얼로그 및 탈퇴 액션 추가
  - 탈퇴 완료 후 즉시 로그아웃하고 `/auth/login`으로 이동하도록 단순화
- 유저 검색 기능 구현
  - `search_users` RPC 기반 `features/search/api.ts` 추가
  - 최근 검색 localStorage 관리 (`search_history`, 최대 10개)
  - 검색 입력/결과/최근 검색 컴포넌트 분리
  - `/search` 페이지에 300ms debounce, 최근 검색, 프로필 이동 연결
- 버그 수정
  - `comment_likes` INSERT RLS `WITH CHECK` 추가

## 2026-05-24

### 현재 상태 확인
- 프로젝트 경로: `/mnt/c/dev/univer` (`C:\dev\univer`)
- 로컬 URL: `http://localhost:3000/`
- 기존 오류: `lightningcss.linux-x64-gnu.node missing`
- 조치 완료: `node_modules`, `.next` 삭제 후 `npm install` 재실행
- 현재 화면 상태: 로그인 페이지 정상 표시, 브라우저 콘솔 에러 없음
- Git 상태: `package-lock.json`만 변경됨 (`npm install` 재실행 영향으로 보임)

### 문서/코드 기준 진행 상태
- 기능명세서 기준 핵심 방향: 대학생 실명 SNS, 국민대 우선, 사진 중심 SNS MVP, 전교생/크루 공개 범위, 피드/스토리/프로필/알림/관리자 기능 중심
- 로컬 코드 기준 이미 구현된 큰 기능
  - 이메일+비밀번호 로그인/회원가입/온보딩/미들웨어
  - 메인 레이아웃, 피드, 게시물 작성/수정/삭제, 게시물 상세 모달
  - 댓글/대댓글/좋아요, 스토리 업로드/뷰어/삭제
  - 프로필/프로필 편집/설정/로그아웃/계정 탈퇴
  - 유저 검색, 알림, 신고, 관리자 1차 페이지
  - 친구(크루) 신청/수락/거절/삭제 흐름

### 확인 중 발견한 문제
- `npm run lint` 실패
  - React 19/Next 16 ESLint 규칙 `react-hooks/set-state-in-effect` 관련 에러 6개
  - 위치: `/search`, `/profile/edit`, `/admin`, `/admin/reports`, `/admin/users`, `MainLayoutShell`
  - 경고 3개: 미사용 변수/의존성 경고
- 실제 로그인 테스트는 아직 계정 정보 확인이 필요함
  - 일반 계정 로그인 가능 여부 확인 필요
  - 관리자 계정 로그인 후 `/admin` 접근 가능 여부 확인 필요

### 내일 바로 할 일
1. 일반 계정으로 로그인 테스트
   - `/auth/login`에서 이메일+비밀번호 입력
   - 로그인 성공 시 `/` 홈 피드로 이동하는지 확인
   - 온보딩 미완료 계정이면 `/onboarding` 이동 여부 확인
2. 관리자 계정으로 로그인 테스트
   - 관리자 계정 로그인
   - `/admin` 접근 가능 여부 확인
   - 비관리자 계정은 `/admin` 접근 시 `/`로 돌려보내지는지 확인
3. `npm run lint` 에러 수정
   - `setState`를 직접 effect 안에서 호출하는 패턴 정리
   - admin/search/profile/edit/MainLayoutShell 순서로 수정
4. 수정 후 검증
   - `npm run lint`
   - `npm run build`
   - 로그인/관리자 화면 수동 확인
5. 남은 기능 작업 재개
   - 기존 `/posts/write` 라우트 삭제
   - 스토리 UI/UX 개선
   - 좋아요 목록 모달
   - 관리자 액션 범위 확장
