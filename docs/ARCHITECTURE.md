# ARCHITECTURE

## 서비스 개요
UniVerse — 대학생 실명 SNS 커뮤니티 플랫폼
- 같은 학교 가입 즉시 전원 자동 연결, 팔로우 없음
- 1차 타겟: 국민대학교

## 기술 스택
- Next.js 16 App Router + TypeScript + Tailwind CSS
- React 19
- Supabase (Auth, Postgres, Storage, Realtime)
- Vercel 배포
- Expo (React Native) — 앱 전환 예정

## 개발 단계
```
1단계 → SNS MVP (피드, 스토리, 좋아요, 댓글, 프로필, 채팅)  ← 현재
2단계 → 커뮤니티 (자유게시판, 베스트, 수업찾기)
3단계 → 앱 전환 (Expo, 모노레포)
4단계 → 부가 기능 (AI 커리어, 포트폴리오)
```

## 아키텍처 원칙

### 앱 전환 대비 (최우선)
```
components/   ← UI만 (웹 전용)
features/     ← 로직/훅/API → 앱 전환 시 재사용
```
- Supabase 쿼리는 반드시 `features/*/api.ts` 에서만
- 컴포넌트는 props로만 동작하도록 순수하게 유지

### 모바일 퍼스트
- 375px 기준 설계
- 웹은 3단 레이아웃 (사이드바 + 피드 + 우측패널)

### 데이터 원칙
- soft delete: `deleted_at` 패턴
- 시간: UTC 저장, KST 출력
- 이미지: Supabase Storage 저장, DB에는 URL만

## 화면 구조

### 모바일
```
[Header: 로고 | 알림 | 채팅]
[스토리바]
[피드]
[BottomTabBar: 홈 | 검색 | + | 카테고리 | 프로필]
```

### 웹 (3단)
```
[Left: 사이드바 (홈, 검색, 카테고리, 프로필, 메시지, 알림, 새 게시물)]
[Center: 스토리바 + 피드]
[Right: 내 프로필, 핫 해시태그, 추천 유저]
```

## 라우팅
```
/                          홈 (피드)
/search                    유저 검색
/write                     게시물 작성/수정
/category                  카테고리 (미구현)
/profile/[nickname]        프로필
/profile/me                본인 프로필 alias
/profile/edit              프로필 편집
/profile/connections       크루(친구) 관리
/settings                  설정 (로그아웃, 계정 탈퇴)
/messages                  채팅 목록
/messages/[conversationId] 채팅방 (fullscreen layout)
/notifications             알림 (모바일)
/story/[userId]            스토리 뷰어
/story/create              스토리 작성
/posts/[postId]            게시물 상세 직접 접근
/admin                     관리자 대시보드
/admin/reports             신고 관리
/admin/users               유저 관리
/auth/login                로그인
/auth/signup               회원가입
/onboarding                온보딩
```

## 디렉토리 구조
```
src/
  app/
    (auth)/                    ← 인증 페이지 그룹 (레이아웃 없음)
      auth/
        callback/route.ts
        login/
        signup/
    (main)/                    ← 메인 앱 (Header + NavItems 레이아웃)
      layout.tsx
      page.tsx                 ← 홈 피드
      messages/                ← 채팅 목록
      notifications/
      profile/[nickname]/
      search/
      story/[userId]/
    (fullscreen)/              ← 하단 탭바/사이드바 없는 전용 화면
      messages/[conversationId]/
    (sub)/                     ← 자체 헤더 화면 (뒤로가기 헤더)
      layout.tsx
      posts/[postId]/
      profile/connections/
      profile/edit/
      settings/
      write/
    @modal/                    ← 웹 인터셉트 모달
      (.)posts/[postId]/
    admin/                     ← 관리자 (별도 레이아웃)
    onboarding/
  components/
    admin/                     ← AdminSidebar
    chat/                      ← ConversationItem, MessageBubble, MessageInput
    common/                    ← Avatar, ActionSheet, ConfirmDialog, Toast, UserInfo
    feed/                      ← FeedList, PostCard, PostDetail, PostImageUploader 등
    layout/                    ← Header, BottomTabBar, SideBar, NavItems, MainLayoutShell
    notifications/             ← NotificationPanel
    search/                    ← SearchInput, UserSearchList 등
    story/                     ← StoryBar, StoryItem
  features/
    admin/api.ts
    auth/api.ts
    chat/api.ts + hooks.ts
    comments/api.ts
    feed/api.ts
    notifications/api.ts
    profile/api.ts + mutations.ts
    reports/api.ts
    search/api.ts + history.ts
    stories/api.ts
  lib/
    supabase/
      browser.ts
      server.ts
    utils/
      time.ts
  middleware.ts
  types/
    database.types.ts
supabase/
  migrations/
docs/
```

## 앱(모바일) 구조 — `apps/mobile`

Expo Router + React Native. 웹(`src/`)과 로직을 **복사-포팅**하며, 웹과 동일하게 `screens`(화면 조립) / `components`(순수 UI) / `features`(로직·훅·API) 3분할을 지킨다.

```
apps/mobile/
  app/                      ← Expo Router 라우트 (얇게, 화면 컴포넌트 연결만)
    _layout.tsx             ← 루트(Provider들 + Sentry.wrap)
  src/
    screens/                ← 화면 = 훅 연결 + 레이아웃 조합만 (로직/UI 인라인 금지)
      home/ feed(릴스)/ explore/ post/ profile/ messages/
      stories/ search/ notifications/ activity/ settings/ auth/ tabs/
    components/             ← 순수 UI (props로만 동작)
      home/ feed/ comments/ profile/ stories/ chat/ search/
      activity/ notifications/ common/ auth/ write/
    features/              ← 로직/훅/API (앱 전환 재사용 핵심)
    lib/                    ← supabase, theme, session, sentry, site,
                              constants/(storage·pagination), utils/
```

### features API 모듈 패턴 (2026-07 리팩토링 결과)
각 `features/<도메인>/api.ts`는 **public re-export 진입점**으로만 두고, 실제 구현은 역할별 모듈로 분리한다(각 200줄 이하). 호출부 import 경로(`features/<도메인>/api`)는 그대로 유지돼 무중단.

```
features/feed/
  api.ts               ← re-export 진입점
  feedQueries.ts       ← 조회
  postMutations.ts     ← 작성/삭제
  postInteractions.ts  ← 좋아요/저장/카운트
  postUpload.ts        ← 업로드
  videoStatus.ts       ← Cloudflare 상태 조회
  feedHydration.ts     ← DB row → FeedPost 조립
  internalTypes.ts     ← 내부 타입
  use*.ts              ← 화면용 훅 (useHomeFeed, useReels, useWriteForm 등)
```

같은 패턴 적용: `notifications`(조회/변경/메타/hydration), `chat`(access/목록/메시지/공유/unread), `activity`(스토리/게시물/hydration/즐겨찾기), `profile`(조회/크루/즐겨찾기/internal), `stories`(업로드/변경/조회/조회자/상호작용/hydration).

- **Supabase 쿼리는 `features/*/` 안에서만** (화면/컴포넌트에서 직접 호출 금지)
- 화면 훅(`use*.ts`)도 큰 것은 책임 분리: 예) `useHomeFeed` → pagination/actions/sync/feedback 훅으로 쪼갬
- 세부 진행/미완 항목은 `docs/REFACTOR_PLAN.md` 참고

### 테마/색 시스템 (다크모드, 2026-08 도입)
색은 **전부 `lib/theme.ts`의 의미 토큰을 거친다. 하드코딩 hex/rgba 금지.**

- `lib/theme.ts` — `lightColors`/`darkColors`(키 동일, `satisfies`로 강제) + `type ThemeColors`. 하위호환용 `colors = lightColors`.
- 루트 `ThemeProvider`가 `useColorScheme()`으로 시스템 라이트/다크를 따라 팔레트를 준다. (v1은 시스템 자동만, 수동 토글은 이후)
- **컴포넌트 규칙**: 모듈 최상단 `StyleSheet.create`에 색을 박으면 다크에서 안 바뀐다. 대신
  - `const makeStyles = (c: ThemeColors) => StyleSheet.create({... c.token ...})` + `const styles = useThemedStyles(makeStyles)`
  - JSX 인라인 색(`color=`, `fill=` 등)은 `const { colors } = useTheme()`
- **flip / fixed**: 앱 UI(글씨·배경·테두리)는 flip(라이트↔다크 뒤집힘), 미디어(릴스/스토리) 위 오버레이·상태색은 fixed(라이트=다크 동일). 브랜드색(구글 버튼, `Logo`의 unip 레드)은 팔레트 밖 고정.
- 정본/상세: `docs/design/COLOR_TOKENS.md`(토큰 정의·매핑), `docs/design/DARK_MODE.md`(다크 아키텍처·현황).
- 라이브러리 없음(네이티브 리스크 회피). 딥다크 팔레트(배경 `#0F1011`, 카드 `feedCard #000`) 값은 `theme.ts`가 정본.
