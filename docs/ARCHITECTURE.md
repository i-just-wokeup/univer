# ARCHITECTURE

## 서비스 개요
UniVerse — 대학생 실명 SNS 커뮤니티 플랫폼
- 같은 학교 가입 즉시 전원 자동 연결, 팔로우 없음
- 1차 타겟: 국민대학교

## 기술 스택
- Next.js 16 App Router + TypeScript + Tailwind CSS
- Supabase (Auth, Postgres, Storage, Realtime)
- Vercel 배포
- Expo (React Native) — 앱 전환 예정
- 현재 런타임 버전: React 19

## 개발 단계
```
1단계 → SNS MVP (피드, 스토리, 좋아요, 댓글, 프로필)
2단계 → 채팅 (DM 1대1, 단체 채팅)
3단계 → 커뮤니티 (자유게시판, 베스트, 수업찾기)
4단계 → 앱 전환 (Expo, 모노레포)
5단계 → 부가 기능 (AI 커리어, 포트폴리오)
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
- 이미지: 업로드 전 클라이언트 압축 (browser-image-compression)

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
[Left: 사이드바 (홈, 검색, 카테고리, 프로필, 채팅, 알림)]
[Center: 스토리바 + 피드]
[Right: 내 프로필, 핫 해시태그, 추천 유저]
```

## 라우팅
```
/                  홈 (피드)
/search            검색
/posts/write       게시물 작성
/category          카테고리
/profile/[id]      프로필
/chat              채팅
/notifications     알림
/story/[id]        스토리 뷰어
/auth/login        로그인
/auth/signup       회원가입
/onboarding        온보딩
```

## 디렉토리 구조
```
src/
  app/
    (auth)/           ← 인증 관련 페이지 그룹
      auth/
        callback/route.ts
        login/
          LoginForm.tsx
          page.tsx
        signup/
          SignupForm.tsx
          page.tsx
      login/page.tsx   ← `/auth/login` alias
      signup/page.tsx  ← `/auth/signup` alias
    (main)/           ← 메인 앱 페이지
      layout.tsx
      page.tsx        ← 홈 피드
      posts/write/
    onboarding/
      page.tsx
    layout.tsx
    globals.css
  components/
    feed/
      FeedList.tsx
      PostCard.tsx
      PostImageUploader.tsx
    story/
      StoryBar.tsx
      StoryItem.tsx
    layout/           ← Header, BottomTabBar, SideBar
  features/
    auth/
      api.ts
    feed/
      api.ts
  lib/
    supabase/
      browser.ts
      server.ts
  middleware.ts
  types/
    database.types.ts
supabase/
  migrations/         ← DB 마이그레이션 파일
docs/                 ← 운영 문서
```

## 2026-04-28 구현 메모
- 현재 문서 기준보다 실제 구현이 앞선 항목: 인증(비밀번호 로그인/회원가입), 온보딩, 게시물 작성, 피드 조회 및 렌더링
- 아직 비어 있는 라우트(`search`, `category`, `profile`, `chat`, `notifications`, `story`)는 추후 단계에서 추가 예정
- 인증/피드/Supabase 핵심 파일에는 한국어 주석을 추가해 역할과 책임을 코드 레벨에서도 바로 파악할 수 있게 유지
