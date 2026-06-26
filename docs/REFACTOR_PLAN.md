# REFACTOR PLAN (앱 / apps/mobile)

2026-06-26 코드 스캔 기준. 재사용 구조인데 하드코딩됐거나 중복/구조 문제 정리.
실제 작업은 Codex로 진행, 작업 시 `cd apps/mobile && npx tsc --noEmit` 통과 필수.

## 🟢 빠른 정리 (저위험·고효율, 1순위)
- [ ] **버킷명 상수화** — `"avatars"`/`"post-images"`/`"story-images"` + 폴더 `"posts"`/`"stories"`가 `features/feed/api.ts`·`stories/api.ts`·`profile/mutations.ts`에 흩어짐 → `lib/constants/storage.ts`로 모으기. (곧 post-videos/story-videos 추가 예정이라 선행 이득)
- [ ] **색상 하드코딩 → theme 토큰** — 94곳/35파일. `theme.ts`에 scrim/오버레이, white-alpha, accent-alpha 토큰 추가 후 치환. 최다: `StoryViewerScreen`(10), `ActivityStoryPreviewSheet`(13), `StoryCreateScreen`(7), `PostImageUploader`(6), `Avatar`/`StoryBar`/`ActivityStoryGrid`(4).
- [ ] **매직넘버 상수화** — notifications `limit(50)`, feed/explore limit 등 인라인 → `lib/constants/pagination.ts`. (`MESSAGE_PAGE_SIZE`는 이미 상수)

## 🟡 구조 개선 (DRY)
- [ ] **users 조회 공용 헬퍼** — `id, nickname, avatar_url` select가 7개 api(feed/activity/notifications/comments/chat/stories/profile)에 13곳 반복 → `features/shared/userLookup.ts`(id 배열→유저 맵) 공용화. **중복 제거 효과 최대.**
- [ ] **현재 유저 조회 통일** — `getCurrentUserId` 공용 헬퍼 있는데 일부는 `auth.getUser()` 직접 호출(11+파일) → 전부 헬퍼로 통일.

## 🔴 god 파일 분리 (시간 있을 때)
UI+로직+스타일 혼재, 프로젝트 원칙(features 로직 / components UI 분리) 위배.
- [ ] `StoryViewerScreen` 712줄 / `ProfileEditScreen` 569 / `ProfileScreen` 540 / `StoryCreateScreen` 457 / `CommentsSheet` 428 → 서브 컴포넌트 + hooks 분리
- [ ] api 비대: `notifications/api` 477 / `chat/api` 432 / `activity/api` 416 / `profile/api` 400 → 책임 단위로 분리

## ⚪ 건드리지 말 것 (의도된 설계)
- 웹(`src/`)↔앱(`apps/mobile`) 로직 중복은 의도된 것(복사-포팅). 공용 패키지로 묶지 말 것.
- 구글 이름/학과 파싱은 DB 트리거(`handle_new_user`), 클라이언트로 옮기지 말 것.
- `supabase.ts` 인증 storage(SecureStore) 설정.
