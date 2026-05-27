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
/messages/[conversationId] 채팅방
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
      messages/
      notifications/
      profile/[nickname]/
      search/
      story/[userId]/
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
