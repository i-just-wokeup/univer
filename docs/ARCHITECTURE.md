# ARCHITECTURE

## 서비스 구조

UniVerse의 핵심 도메인은 대학별 실명 SNS 커뮤니티입니다.

- **피드**: 게시물 CRUD, 사진 업로드, 좋아요, 댓글
- **스토리**: 업로드, 뷰어, 자동 만료
- **유저**: 프로필, 유저 좋아요 (팔로우 대체)
- **커뮤니티**: 자유게시판, 베스트, 같은 수업 찾기
- **채팅**: DM, 단체 채팅 (후순위)
- **인증**: 학교 이메일 가입, 구글/카카오, 온보딩

## 기술 스택

- Next.js 14 App Router + TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, Storage, Realtime)
- Vercel 배포
- Expo (React Native) — 앱 전환 예정

## 아키텍처 원칙

### 앱 전환 대비 구조 분리
```
components/   ← UI만 (웹 전용, 나중에 앱용 따로 작성)
features/     ← 로직만 (훅, API) → 앱 전환 시 그대로 재사용
```

### 데이터 흐름
- API route handler: 인증 체크 → 입력 검증 → 권한 검증 → DB 작업
- Supabase 쿼리는 `features/*/api.ts` 에서만
- soft delete: `deleted_at` 패턴
- 시간: UTC 저장, KST 출력

## 디렉토리 구조

```
src/
  app/
    (auth)/           ← 인증 관련 페이지
    (main)/           ← 메인 앱 페이지 (피드, 스토리, 프로필)
    api/              ← API route handlers
  components/
    common/           ← Header, Avatar, BottomTabBar 등
    feed/             ← FeedList, PostCard, LikeButton 등
    story/            ← StoryBar, StoryItem, StoryViewer
    layout/           ← 웹/모바일 레이아웃
  features/
    auth/             ← useCurrentUser, 인증 관련 훅
    feed/             ← useFeed, usePost, feedApi.ts
    story/            ← useStory, storyApi.ts
    profile/          ← useProfile, profileApi.ts
  lib/
    supabase/         ← browser.ts, server.ts
    utils/            ← date.ts 등
  types/              ← database.types.ts
  constants/          ← 상수
supabase/
  migrations/         ← DB 마이그레이션 파일
docs/                 ← 운영 문서
```

## 레이아웃 구조

### 모바일 (375px~)
```
[Header: 로고 + 알림]
[StoryBar]
[Feed]
[BottomTabBar: 홈 | 검색 | + | 채팅 | 프로필]
```

### 웹 (1280px~)
```
[좌: 사이드바 (홈, 검색, 카테고리, 채팅, 프로필)]
[중: 피드 (max-w-xl)]
[우: 추천 친구, 해시태그, 진행 중인 활동]
```

## 주의사항

- 헤더/탭바는 전역 레이아웃에서 처리
- 이미지는 업로드 전 클라이언트에서 압축 (browser-image-compression)
- 영상은 MVP 제외
- Supabase Realtime은 좋아요/알림에 사용
