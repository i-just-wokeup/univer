# REFACTOR PLAN (앱 / apps/mobile)

2026-06-26 코드 스캔 기준. 재사용 구조인데 하드코딩됐거나 중복/구조 문제 정리.
실제 작업은 Codex로 진행, 작업 시 `cd apps/mobile && npx tsc --noEmit` 통과 필수.

> **진행 현황 (2026-07-08 갱신):** 🔴 god 파일 분리 + api 비대 분리 **완료**(라인수 검증). 🟢 버킷명/매직넘버 상수화 **완료**(`lib/constants/storage.ts`·`pagination.ts` 존재). 남은 것: 🟢 색상 토큰(rgba 53파일 잔존), 🟡 users 조회 헬퍼(`userLookup.ts` 미생성), 🟡 현재 유저 조회 통일.

## 📦 2026-09-11 전수 감사 (Codex + Claude Code)

> Claude Code가 디자인 계층 11건, Codex가 로직·JSX 계층 10건. **전부 파일·줄 대조 확인됨.**
> 착수는 **Play 프로덕션 액세스 신청(9/13) 이후.** 단, 아래 A·B는 리팩토링이 아니라 **버그**라 먼저 해도 된다.

### 🔴 버그 (중복이 아닌 실제 결함)

- [ ] **A. 검색 요청 세대 방어 없음** — `useUserSearch.ts:44` 정리 함수가 **타이머만 취소**하고 이미 나간 요청은 안 막는다. "김" → "김철" 타이핑 시 **늦게 도착한 예전 결과가 화면을 덮어쓴다.** 3곳 동일(`search/useUserSearch.ts`, `chat/useMessagesList.ts`, `chat/usePostShare.ts`, 전부 300ms).
  - 이미 정답이 프로젝트 안에 있다 — `features/metrics/` 훅 3개는 요청 번호 대조 방어를 이미 하고 있다(아래 6번). 검색만 빠졌다.
- [ ] **B. 페이지 캐시 만료 비교가 서로 다름** — TTL은 3곳 모두 300,000ms로 같은데 비교가 `explore`/`profile` 은 `<`, `feed` 만 `<=`. 한 줄 통일.

### 🟡 중복 — 신청 후 착수

| 순 | 항목 | 파일 | 비고 |
|---|---|---|---|
| C | **자동 사라지는 피드백 타이머** — 5파일 전부 1800ms 동일. → `features/shared/useTimedFeedback` | 6 | 순수 중복, 위험 낮음 |
| D | **게시물 공유·스토리 이동 처리** — 4화면 반복. → `usePostShareController` | 5 | 화면별 기능 누락 방지 효과 |
| E | **닉네임 + 계정 배지 JSX** — 5파일. → `components/common/UserNameWithBadge` | 6 | 행 전체를 묶지 말 것 |
| F | **사용자 요약 일괄 조회** — `id, nickname, avatar_url` 이 6곳 + 임베딩 1곳. → `features/users/api.ts` | 7~10 | **아래 기존 항목과 동일 — 6/26부터 미완** |
| G | **날짜 포맷** — 6파일 7지점, 시간대 정책 2종(기기 기본 / KST 명시) | 7 | ⚠️ **단순 분리 아니라 동작 변경.** KST 통일하면 해외 기기 표시가 바뀜 |
| H | **요청 세대 방어 추출** — metrics 훅 3개에 반복. → `useRequestGeneration` | 4 | A와 같이 하면 좋음 |
| I | **스토리 9:16 상수** — 6파일 9지점에 직접 계산식. → `STORY_ASPECT_RATIO` | 7 | 안전하나 절감량 작음 |

### ⚪ 묶지 말 것 (2026-09-11 판단)

- **좋아요·저장 낙관적 업데이트 통합** — 3개 독립 구현이고 데이터 모양도 3종(배열/릴스 항목/단일). **릴스에서 같은 글의 여러 항목을 모두 갱신하는 동작**과 롤백 경합이 위험. 잘못 묶으면 숫자가 틀어지고 찾기도 어렵다.
- **페이지 캐시 추상화** — 계정 격리·만료만 묶는 것도 비용이 크다. 홈의 원래 조회 시각 보존, 탐색의 `allowStale`, 프로필의 닉네임별 저장이 각각 다르다. ⚠️ **잘못 합치면 계정 간 정보 노출** — 웹에서 이미 난 사고다. 단, 위 B(비교 기호 통일)는 별개로 한다.
- **댓글·공유 시트 제스처 전체** — 댓글은 아래로 닫기, 공유는 반열림·전체열림·닫기로 계약이 다르다.
- **모든 사용자 행·탭 통합** — 채팅 행은 대화방 이동+안읽음 수, 검색 행은 프로필 이동. 행 전체가 아니라 **안의 작은 조각(E)** 만 재사용.
- **피드·릴스·스토리 데이터 정책** — 커서·반복 재생·업로드 중 노출·조회 기록이 서로 다른 요구사항이다.
- **스토리와 게시물 크롭** — 스토리 9:16 고정과 게시물 비율 3종은 별도 계약. 상수(I) 만 묶고 처리 흐름은 합치지 말 것.
- **브랜드 SVG 색** — 일반 테마색으로 치환하지 않는다.

### 🎨 디자인 계층 (Claude Code, 2026-09-11)

상세는 노션 백로그/작업일지 참조. **공용이 없는 게 아니라, 있는데 절반만 쓰고 모양 규칙이 없는 게 문제.**

| 항목 | 현황 | 파일 |
|---|---|---|
| 버튼 | 공용 없음. 스타일 정의 **114개**, 높이 9가지·둥글기 8가지. `radius` 토큰은 **1곳만** 사용 | ~90 |
| 눌림 효과 | 70곳 각자 구현. `opacity` 값 **19가지** | ~70 |
| 입력칸 | 공용 없음. 높이 5가지·둥글기 4가지 | 8 |
| 아이콘 | `strokeWidth` **11가지**(1.8~3.2), size 17가지 | ~40 |
| 바텅시트 | 6개가 각자 `Modal`. 열리는 방식이 fade/none/slide로 갈림 | 6 |
| Avatar | 공용은 있으나 `size` 값 13가지 | ~14 |
| 헤더 | `ScreenHeader` 13곳 쓰는데 직접 정의가 18곳 | ~18 |
| 빈 상태 | `StateView` 21곳 쓰는데 직접 정의 17곳 | ~17 |
| 글자 크기 | 토큰 293곳 vs 숫자 직접 295곳. 단계가 **16개**로 너무 많음 | ~150 |
| `fontWeight` 이름 | 표준보다 한 칸씩 밀림(`bold:"800"`) | 토큰 |
| `Alert.alert` | `SearchScreen.tsx:52` 한 곳만 OS 기본 팝업 | 1 |

**착수 순서 제안**: 아이콘 굵기 통일(파일 적고 효과 큰) → 바텅시트 통일(6개뿐) → 공용 `Button` → 입력칸 → 나머지

---

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
