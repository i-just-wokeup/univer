# REFACTOR PLAN (앱 / apps/mobile)

2026-06-26 코드 스캔 기준. 재사용 구조인데 하드코딩됐거나 중복/구조 문제 정리.
실제 작업은 Codex로 진행, 작업 시 `cd apps/mobile && npx tsc --noEmit` 통과 필수.

> **진행 현황 (2026-07-08 갱신):** 🔴 god 파일 분리 + api 비대 분리 **완료**(라인수 검증). 🟢 버킷명/매직넘버 상수화 **완료**(`lib/constants/storage.ts`·`pagination.ts` 존재). 남은 것: 🟢 색상 토큰(rgba 53파일 잔존), 🟡 users 조회 헬퍼(`userLookup.ts` 미생성), 🟡 현재 유저 조회 통일.

## 🟢 빠른 정리 (저위험·고효율, 1순위)
- [x] **버킷명 상수화** — `lib/constants/storage.ts`로 모음. (완료)
- [ ] **색상 하드코딩 → theme 토큰** — 94곳/35파일. `theme.ts`에 scrim/오버레이, white-alpha, accent-alpha 토큰 추가 후 치환. 최다: `StoryViewerScreen`(10), `ActivityStoryPreviewSheet`(13), `StoryCreateScreen`(7), `PostImageUploader`(6), `Avatar`/`StoryBar`/`ActivityStoryGrid`(4). (rgba 잔존 53파일 — 미완)
- [x] **매직넘버 상수화** — `lib/constants/pagination.ts`로 모음. (완료)

## 🟡 구조 개선 (DRY)
- [ ] **users 조회 공용 헬퍼** — `id, nickname, avatar_url` select가 7개 api(feed/activity/notifications/comments/chat/stories/profile)에 13곳 반복 → `features/shared/userLookup.ts`(id 배열→유저 맵) 공용화. **중복 제거 효과 최대.** (미완)
- [ ] **현재 유저 조회 통일** — `getCurrentUserId` 공용 헬퍼 있는데 일부는 `auth.getUser()` 직접 호출(11+파일) → 전부 헬퍼로 통일. (미완)

## 🔴 god 파일 분리 — ✅ 완료 (2026-07-06~08, Codex)
UI+로직+스타일 혼재, 프로젝트 원칙(features 로직 / components UI 분리) 위배였던 것 해소.
- [x] 화면 분리: `StoryViewerScreen` 712→79줄 / `ProfileEditScreen` 569→171 / `ProfileScreen` 540→167 / `CommentsSheet` 428→190. (`StoryCreateScreen` 457→341, 부분 축소)
  - 패턴: 화면은 훅 연결 + 레이아웃 조합만, UI 조각은 `components/*` 순수 컴포넌트, 로직은 `features/*/use*.ts` 훅으로.
- [x] api 비대 분리: `notifications/api` 477→4 / `chat/api` 432→22 / `activity/api` 416→12 / `profile/api` 400→23 / `feed`·`stories`·`search`도 동일.
  - 패턴: `api.ts`는 **public re-export 진입점**으로 축소, 실제 로직은 역할별 모듈(조회/변경/업로드/hydration/타입)로 분리, 각 조각 200줄 이하. 기존 호출부 import 경로 유지.

## ⚪ 건드리지 말 것 (의도된 설계)
- 웹(`src/`)↔앱(`apps/mobile`) 로직 중복은 의도된 것(복사-포팅). 공용 패키지로 묶지 말 것.
- 구글 이름/학과 파싱은 DB 트리거(`handle_new_user`), 클라이언트로 옮기지 말 것.
- `supabase.ts` 인증 storage(SecureStore) 설정.
