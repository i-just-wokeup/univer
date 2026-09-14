# DECISIONS

왜 이렇게 결정했는지 기록. 나중에 "왜 이렇게 했지?" 혼란 방지용.

---

## 코드에 박힌 의도된 값

> **값이나 동작을 바꾸기 전에 여기부터 볼 것.** 코드에는 `// 의도:` 로 표시해 뒀다(`grep "의도:"`).
> 마지막 코드 대조: **2026-09-14** — 아래 "확인" 열은 그날 실제 코드·원격 DB에서 확인한 결과다.
> 출처: `docs/WORKLOG.md` 전수 + 노션 작업 일지 1권. 대조 방식은 2026-09-14 작업일지 참고.

### 디자인 — 2026-07-03 "인스타식 축소"

한 번에 묶어서 내린 결정이다. **"크고 두껍다"는 사용자 피드백이 반복돼** 요소를 전반적으로 줄였다.
개별 값이 제각각으로 보여도 이 날짜 묶음은 의도된 것이니 되돌리지 말 것.

| 무엇 | 값 | 확인 |
|---|---|---|
| 피드 아바타 | 34 (42에서) | `components/feed/FeedPostHeader.tsx:31` ✅ |
| 피드 닉네임 | 14 (16에서) | `FeedPostHeader.tsx:35` ✅ |
| 좋아요·댓글 숫자 | 13 / 굵기 700 (16·900에서) | `components/feed/FeedPostActions.tsx:115` ✅ |
| 회색 메타 | 12 / 굵기 500 (14·700에서) | `components/common/UserInline.tsx:95` ✅ |
| 탭바 아이콘 | 25 (31에서) | `components/common/BottomTabBar.tsx:138` ✅ |
| 탭바 + 버튼 | 46 (58에서) | `BottomTabBar.tsx:167` ✅ |
| 탭바 높이 | 54 (78에서) + `insets.bottom` | `BottomTabBar.tsx:54` ✅ |
| 탭바 배경 | 불투명 (반투명에서) | `BottomTabBar.tsx:159`, `theme.ts:95` ✅ |
| 헤더 알림·메시지 아이콘 | **strokeWidth 2** (2.6에서) | `components/home/HomeHeader.tsx:49,65` ✅ |
| 스토리 카드 | 100 × 140 (128×176에서) | `components/stories/StoryBar.tsx:20` ✅ |
| 헤더 알림·메시지 버튼 | 44×44 터치 영역, **원형 배경 없음** | `HomeHeader.tsx:99` ✅ |

🔵 **헤더 버튼의 원형 배경은 일부러 없앨다** — "별로 안 이쁘어서"(2026-09-14 확인). 7-03 기록에는 "원형 버튼 52→44"라고 있지만 **지금은 44×44 터치 영역만 남았고 `borderRadius`·배경색이 없다.** 혼동을 막기 위해 스타일 이름도 `circleButton` → `iconButton` 으로 바꿨다.

⚠️ **아이콘 굵기 2는 여기서 나온 값이다.** 굵기 통일 작업이 이걸 2.4 같은 값으로 되돌리면 안 된다.
피드 액션(4곳)·홈 헤더(2곳)·탭바·릴스 더보기·갤러리·리셰어 미디어가 해당된다.

### 카메라 — 되돌리면 바로 깨진다

| 무엇 | 왜 | 확인 |
|---|---|---|
| 제스처를 `CameraView` 가 아니라 **형제 투명 View** 에 붙인다 | 직접 감싸면 **촬영까지 죽는다** | `components/camera/CameraCaptureView.tsx:73,130` ✅ |
| 줌을 `useAnimatedProps` 가 아니라 **일반 React state** 로 전달 | AnimatedProps 줌은 **Fabric에서 조용히 무시됨** | `features/camera/useCameraCapture.ts:84` ✅ |
| `ratio="16:9"` | 4:3은 화면이 작고 스토리 결과와 불일치. **Android 전용 속성** | `CameraCaptureView.tsx:83` ✅ |
| `mirror` | 셀카 좌우 반전 | `CameraCaptureView.tsx:77` ✅ |
| 앨범 저장에 `initialAssetLocalUri` | DCIM에 만든 뒤 옮기면 **Android 이동 확인창·중복** 발생 | `useCameraCapture.ts:47` ✅ |
| 앨범명 `unip` | | `useCameraCapture.ts:19` ✅ |
| **iOS 미리보기를 9:16 박스로 묶음** | `ratio` 가 Android 전용이라 iOS는 화면을 꽉 채웠고, 사진이 미리보기에 맞춰져 화면 비율로 찍혔다(실측 888x1920) | `CameraCaptureView.tsx` ✅ |
| **iOS `pictureSize="3840x2160"`** | 기본 세션이 1920x1080(207만 화소)이라 너무 낮았다. `"Photo"`(1200만)는 4:3이라 Android와 프레이밍이 달라져 쓰지 않는다 | `CameraCaptureView.tsx` ✅ |
| **준비 상태 초기화는 Android 에서만** | iOS는 `facing` 만 바뀔 때 `onCameraReady` 를 다시 안 불러, 초기화하면 로딩이 영영 남고 촬영이 잠긴다 | `useCameraCapture.ts` ✅ |
| **게시물 카메라 Modal 안에 `SafeAreaProvider`** | Modal 은 네이티브 계층이 분리돼 최상위가 잰 여백이 안 넘어온다. X 버튼이 노치에 가려 안 눌렸다 | `PostCamera.tsx` ✅ |

🍎 **iOS 반영 완료 (2026-09-14, iPhone 12 실기기).** `ratio` 는 여전히 Android 전용이고, 위 네 항목이 그 대응이다.
결과적으로 **iOS 2160x3840(830만) · Android 2252x4000(900만)** 으로 비율이 같아졌고, 양쪽 모두 미리보기와 찍힌 범위가 일치한다.
Android 코드 경로는 건드리지 않았고 해상도·버튼 위치 변화 없음을 확인했다.

### 피드·릴스·열람

| 무엇 | 값 | 왜 | 확인 |
|---|---|---|---|
| 열람("봤다") 기준 | **면적 80% + 2초** | 충분히 엄해 조정 효과가 작다고 판단 | `lib/constants/feedViewability.ts:1,2` ✅ |
| 영상 자동재생 기준 | **60%** | **위와 다른 설정이다.** 어느 영상을 틀지 정하는 값 | `components/home/HomeFeedList.tsx:149` ✅ |
| "모두 열람했습니다" 마커 | `band >= 3` | 밴드 숫자를 직접 판단하는 **유일한 화면 코드** | `HomeFeedList.tsx:266,329` ✅ |
| 릴스 목록 | **전용 RPC `get_reel_post_ids`** | 탐색 목록 재사용이 아니다. 커서 방식이라 탐색의 offset 결함이 없다 | `features/feed/feedQueries.ts:202` ✅ |
| 밴드 0 작성자당 | 최신 2개 | 한 사람이 상단 도배 못 하게. 초과분은 **삭제가 아니라 다른 밴드로 이동** | `20260904150000_..._author_cap.sql` ✅ |
| `p_fresh_hours` | **48** | 반응 없는 새 글이 6시간 뒤 핫스코어에 밀려 묻히던 문제 | 원격·로컬 모두 48 ✅ |
| `p_creator_boost` | 1.5 | 승격 계정 1명 기준으로 맞춘 값. **영구 규칙 아님 — 교체 예정** | 원격·로컬 모두 1.5 ✅ |
| 본 글 재노출 기준 | **본 시각이 아니라 글 작성 시각** | | `FEED_RANKING.md` 참고 |
| 페이지 캐시 TTL | 3곳 모두 300,000ms | 홈·탐색·프로필은 **정책이 달라 합치지 않는다** | `feed/explore/profile page-cache.ts` ✅ |
| 사진 정렬 | `SortBy.default` | 촬영일·수정일은 **받은 사진의 추가 순서와 다름**. ID 정렬은 iOS 크래시 | `features/feed/postMediaLibrary.ts:175` ✅ |

### 제한값

| 무엇 | 값 | 확인 |
|---|---|---|
| 게시물 사진 | 최대 10장 | `features/feed/useWriteForm.ts:13` ✅ |
| 썸네일 길게 누르기 | 300ms | `components/write/PostMediaCropThumbnailStrip.tsx:28` ✅ |
| 썸네일 한 칸 | 60 (52 + 간격 8) | `PostMediaCropThumbnailStrip.tsx:23` ✅ |
| 영상 길이·용량 | 클라 60초 / 250MiB, 서버 65초 | `postMediaLibrary.ts:5`, `stream-upload-url/index.ts:77` ✅ |
| 검색 디바운스 | 300ms (3곳) | `useUserSearch` · `useMessagesList` · `usePostShare` ✅ |
| 승격 자격 | 누적 10개 + 최근 30일 5개 | **의도적으로 정한 값**(2026-09-14 확인). 대기 신청 1개·거절 후 7일 쿼다운 |

### 색·테마

| 무엇 | 왜 | 확인 |
|---|---|---|
| `lightColors` / `darkColors` 두 벌 | | `lib/theme.ts:5,67` ✅ |
| **배지 브랜드색은 팔레트 토큰 밖** | 로고와 동일 원칙. 테마 따라 바뀌면 안 됨 | `components/common/badge/badgeSpec.ts:3` ✅ (주석 있음) |
| 릴스 배지 `forceScheme="dark"` | 어두운 영상 위 | `components/feed/ReelFooter.tsx:40` ✅ |
| 릴스 아이콘 `strokeWidth 1.8` | 어두운 배경 위라 얇게 | `components/feed/ReelActions.tsx` (6곳) |
| `DoubleTapLike` `strokeWidth 0` | **꽉 찬 하트라 테두리가 없어야 함** | `components/common/DoubleTapLike.tsx:100` |
| 스토리 색 팔레트·미디어 위 고정색 | 콘텐츠 색이라 UI 테마와 구분 | |

⚠️ **`flip` / `fixed` 구분은 문서에만 있고 코드에는 없다.** 2026-08 기록에 *"같은 값이라도 역할이 flip(테마 따라 뒤집힘)/fixed(테마 무관 고정)면 다른 토큰으로 분리"* 라고 돼 있으나, `theme.ts` 에 그 표시가 없다.
**색 토큰을 통합할 때 값이 같다고 합치면 다크모드가 깨진다.** 합치기 전에 그 색이 어디 쓰이는지(영상·사진 위인지, 브랜드인지) 반드시 확인할 것.

### 권한·계정

| 무엇 | 확인 |
|---|---|
| 스토리 작성 = 승격·공식만 (앱 + 원격 INSERT RLS 양쪽) | `features/stories/useStoryCreationAccess.ts:9` ✅ |
| 팔로우 대상 = 승격·공식만 (원격 RLS, 미탈퇴·활성 강제) | `20260827120000_follows_insert_...sql:12` ✅ |
| **인사이트는 화면 자체는 누구나 열린다** | `screens/insights/InsightsScreen.tsx:43` ✅ |
| 위치 권한 미사용 (`expo-location` 미설치) | 앱 전체 검색 0건 ✅ |
| 크루는 배지를 표시하지 않는다 | 2026-08-05 결정 |
| 좋아요·친구 푸시는 **의도적 보류** (스팸 우려) | 켜려면 push 트리거에 type만 추가 |

⚠️ **인사이트를 "승격 전용"이라고 적으면 틀린다.** 일반 계정도 개요 화면이 열리고, `useInsights(hasFullInsights)` 로 **데이터 로드만 꺼져** 빈 개요 + 승격 유도 카드를 본다. 탭과 콘텐츠 지표가 승격·공식 전용이다.

### DB·보안

| 무엇 | 왜 | 확인 |
|---|---|---|
| **모든 public 함수에 `SET search_path`** | search_path 조작을 통한 악성 함수 주입 차단 | 원격 71개 전부 설정, 미설정 0개 ✅ |
| 학교 도메인 검증·Google 이름/학과 파싱을 **DB 트리거**에서 | 클라이언트·`hd` 힌트 우회 차단 | `handle_new_user()` |
| `users` 민감 컬럼은 **BEFORE UPDATE 트리거**로 보호 | users RLS 자체 조회의 무한 재귀 회피 | |
| 닉네임은 `user_랜덤값`, 이메일 앞부분 쓰지 않음 | 이메일 노출 방지 | |
| 댓글은 **hard delete** (다른 곳은 soft delete) | 댓글 삭제 계약 유지 | |
| 계정 삭제는 30일 보존, 복구는 **삭제 시각이 일치하는 콘텐츠만** | 개별 삭제한 글까지 되살리지 않음 | |
| 차단 시 크루·즐겨찾기는 해제하되 **자동 복구 안 함**. 좋아요·저장·댓글은 삭제 않고 숨김 | 관계 제거와 활동 보존을 구분 | |

### 배포 — 로컬에서 EAS 명령을 돌릴 때

| 무엇 | 왜 |
|---|---|
| **`eas submit` 앞에 `APP_VARIANT=production` 을 반드시 붙인다** | `app.config.js` 는 값이 없으면 `development` 로 떨어져 `com.univer.app.dev` 를 쓴다. `EAS_BUILD_PROFILE` 은 **EAS 서버에서만** 설정되므로 로컬 명령에는 없다 |
| `eas.json` 의 `submit.production` 에 `ascAppId`·`bundleIdentifier`·`applicationId` | `ascAppId` 는 문서상 "앱 생성 단계를 건너뛴다" — 사고가 난 바로 그 단계다 |

⚠️ **2026-09-14 실제 사고**: `eas submit --platform ios` 를 그냥 돌렸더니 App Store Connect 에 **`unip (dev)` / `com.univer.app.dev` 앱이 새로 등록**됐다. 프로덕션 빌드를 개발 앱에 올릴 뻔했다.
🔸 **빌드는 안전하다.** `eas.json` 의 빌드 프로필에 `env: { APP_VARIANT }` 가 있어 2026-09-03 에 이미 해결됐다(그때는 AAB 서명이 개발 키로 나가 Play 업로드가 거부된 사고였다).
🔸 `bundleIdentifier`·`applicationId` 는 문서상 **"로컬 자격증명을 쓰면 효과 없음"** 이라 보조 장치일 뿐이다. **믿을 것은 `APP_VARIANT=production` 습관이다.**
🔸 안드로이드는 지금까지 AAB 를 Play Console 에 직접 올려 와서 같은 사고가 난 적이 없다. `eas submit` 을 쓴다면 동일하게 접두사를 붙일 것.

### 구조

| 무엇 | 왜 |
|---|---|
| 웹(`src/`) ↔ 앱(`apps/mobile`) 로직 중복 | **복사-포팅이 의도.** 공용 패키지로 묶지 말 것 |
| `api.ts` 는 re-export 진입점, 실제 로직은 역할별 조각 200줄 이하 | 기존 import 경로 보존하며 책임 분리 |
| 댓글 시트(아래로 닫기) vs 공유 시트(55%→92%→닫기) | **계약이 다르다.** 제스처를 통째로 묶지 말 것 |
| 스토리 9:16 고정 vs 게시물 비율 3종 | 별도 계약. 상수만 묶고 처리 흐름은 합치지 말 것 |
| 낙관적 업데이트 3종(배열/릴스 중복 항목/단일 글) | 롤백 계약이 달라 통합 시 카운트가 틀어진다 |
| `react` 19.1.0 고정 | Expo SDK 54 제약 (`react-dom` 19.2.x와 충돌) |

---

### ⚠️ 의도 아님 — 알려진 결함 (보호하지 말 것)

**여기 있는 것은 "일부러 그런 것"이 아니라 아직 안 고친 것이다.** 의도로 착각해 남겨두지 말 것.

- **탐색 `offset` 페이지네이션** — 점수가 시간에 따라 변해 스크롤 중 같은 글이 두 번 나오거나 건너뛴다. 홈은 커서 방식
- **탐색에 작성자 상한 없음** — 홈에는 있다. 크리에이터가 늘면 상단 도배 가능
- **아이콘 굵기 11종** — `2`(7/3 축소) · `1.8`(어두운 배경) · `0`(꽉 찬 하트) **외 나머지는 의도 근거 없음**
- **`opacity` 19종 / 글자 크기 16단계 / 둥글기 28종 / 버튼 스타일 114개** — 의도 근거 없음
- **`nicknameTextStyle` 이 단일 소스가 아니다** — 주석은 "색·굵기 단일 소스"라고 하는데, `RecommendedCrewCard`·`StorySharedPostCard` 는 import하지 않고 `fontWeight` 를 직접 쓴다. 값(700)은 같지만 **공통 객체를 바꿔도 같이 안 바뀐다**
- **`/p/` 공유 페이지가 6월 보라색(`#7c3aed`)** — 앱은 7/31에 모노로 전환했는데 이 페이지만 안 바뀜
- **썸네일 6장 이상일 때 가장자리 자동 스크롤 없음** — 끌어서 맨 끝으로 못 옮긴다
- **저장(`bookmarks`)·영상 완주율(`reel_watch_events`)을 기록하면서 순위에 안 쓴다**
- **`SearchScreen.tsx:52` 만 `Alert.alert`** — 나머지는 공용 `ConfirmDialog`

### ❓ 확인 안 됨 — 사람이 판단할 것

- **스토리 위 여백 16** — 바깥 6 + 안쪽 10을 더해 16. **합이 우연일 수 있어** 의도된 값이라 단정하기 약함
- **탭바 아이콘 25** — 일반 아이콘만 25이고 **추가 버튼은 27**
- **이메일 확인 OFF·Google nonce 검사 예외** — 당시 선택 근거는 있으나 **지금도 안전하다는 보증은 아니다.** 검증 없이 영구 예외로 두지 말 것
- **영상 60초/250MiB, 서버 65초** — 값은 확인됐으나 **5초 차이의 당시 근거는 기록에도 기억에도 없다**(2026-09-14 확인).
  다만 길이를 재는 도구마다 값이 달라 경계에서 정상 업로드가 튀기는 걸 막는 **일반적인 관행(보통 5~10% 여유)과 일치**한다.
  줄이려면 실제 업로드 실패율을 보고 판단할 것.
- **완주 95%·루프 85→15%** — 값은 명시됐으나 산정 근거 미기재 (승격 자격은 2026-09-14에 의도로 확인됨)

### 🔄 번복된 기록 — 되살리지 말 것

옛 작업일지에 남아 있지만 **이후에 뒤집힌 결정**이다.

- 카메라 4:3, `appearance` 별 수치 차이 → 16:9·게시물 기준으로 통일
- 사진 `modificationTime` 정렬 → `default`
- 프로필 활성 링 배경 채움 → SVG 30px·선 2px
- 캐시 60/90초 → 300초
- "iOS 앨범 저장에 재빌드 필요" → **기본 권한이 이미 있어 불필요**로 정정
- 홈피드 밴드 3단(0/1/2) → **5단(0~4)**
- "릴스 = 홈피드에서 영상만 필터" → **전용 RPC `get_reel_post_ids`**
- 초기 MVP 제외 항목(영상·소셜 로그인·팔로우) → **전부 이후에 추가됨**

---

## 2026-08-12

### 스토리 작성은 기관·크리에이터 계정만 허용
**결정:** 스토리 작성 권한은 `official_accounts`에 등록된 학생회·동아리 등 기관 계정 또는 `users.is_promoted = true`인 승격 계정에만 부여한다. 일반 학생은 스토리를 조회할 수 있지만 새 이미지·영상 스토리와 게시물 리셰어 스토리를 작성할 수 없다.

**이유:** 스토리를 개인 일상 게시 수단보다 학교 기관과 크리에이터의 짧은 공지·콘텐츠 채널로 운영해 홈 상단의 정보 밀도와 운영 방향을 명확히 한다. 앱 진입점 숨김만으로 끝내지 않고 `stories` INSERT RLS에도 같은 조건을 적용해 직접 API 호출 우회를 차단한다.

**기존 데이터/후속:** 일반 학생이 이미 작성한 스토리는 삭제하지 않고 기존 24시간 만료로 자연 소멸시킨다. 일반 학생용 안내 문구와 빈 스토리바 설명은 별도 UX 작업으로 남긴다.

---

## 2026-04-23

### 기존 krew 코드 버리고 새로 시작
- krew는 팀빌딩 구조로 짜여있어 SNS 피드 중심으로 전환 시 전부 수정 필요
- 기존 코드 위에서 수정하면 오히려 더 복잡해짐
- Supabase 연결, Vercel 배포, 인증 흐름은 레퍼런스로 참고

### 영상 MVP 제외, 사진만 지원
- 영상 처리(스트리밍, 압축, 썸네일)는 별도 인프라 필요 (Cloudflare Stream 등)
- 영상 때문에 런칭 지연되는 게 더 손해
- 인스타그램도 초기엔 사진만 지원
- 기획안에도 초기 영상 미지원 명시됨

### 팔로우 대신 유저 좋아요 시스템
- 같은 학교 전원이 이미 연결되어 있어 팔로우 불필요
- 좋아요 누른 유저의 콘텐츠를 피드에서 우선 노출하는 방식으로 개인화
- 내향적인 학생도 자연스럽게 참여 가능

### 웹 먼저, 앱은 나중에 (Expo)
- MVP 검증이 먼저
- 웹을 모바일 퍼스트로 잘 만들면 앱 없어도 충분히 검증 가능
- Next.js + React로 짜면 features/ 로직은 Expo에서 재사용 가능
- 처음부터 Expo로 가면 웹 완성도가 낮아짐

### Next.js App Router 선택
- 서버 컴포넌트로 초기 로딩 속도 향상
- SEO 대응 (나중에 검색 유입 고려)
- krew에서 이미 익숙한 스택

### Supabase 선택
- Auth, DB, Storage, Realtime 모두 제공
- krew에서 이미 검증된 스택
- MCP 연결로 Claude Code에서 직접 DB 조작 가능

### 구글/카카오 로그인 제외 (MVP)
**결정:** MVP에서는 학교 이메일 인증만 지원
**이유:**
- 구글/카카오 추가 시 구현 복잡도 증가
- 학교 이메일 인증이 핵심이므로 먼저 완성도 있게 만드는 게 우선
- 추후 소셜 로그인 추가 가능하도록 구조는 열어둠

### 학교 이메일 도메인 검증 방식
**결정:** 이메일 입력 시 도메인 추출 → universities 테이블 매칭
**이유:**
- 학교 추가 시 universities 테이블에 domain만 추가하면 자동 확장
- 코드 수정 없이 학교 확장 가능

---

## 2026-04-27

### kookmin.ac.kr 하드코딩 → universities 테이블 조회로 변경 예정
**결정:** features/auth/api.ts의 하드코딩 제거, universities 테이블에서 domain 조회
**이유:**
- Codex 코드 리뷰에서 발견
- 문서에는 universities 테이블 기반 확장이라고 했는데 실제 코드와 불일치
- 지금 고치지 않으면 학교 추가 시 코드 수정 필요

### MVP 완성 후 구조 리팩터링 예정
**결정:** 구조적 부채는 MVP 완성 후 앱 전환 시작 전에 한 번에 정리
**이유:**
- 지금 리팩터링하면 개발이 멈춤
- 앱 전환 전에 정리하면 Expo에서 재사용 가능한 구조가 됨
- 상세 내용은 docs/NOTES.md "구조적 부채" 섹션 참고

### Next.js 버전 불일치 → 수정 완료 (2026-05-27)
- 모든 문서 Next.js 16 / React 19로 통일

---

## 2026-05-27

### users RLS — 재귀 없는 정책 + 트리거 방식 선택
**결정:** SELECT 정책은 `auth.uid() IS NOT NULL`만 사용, 민감 컬럼 보호는 BEFORE UPDATE 트리거로 분리
**이유:**
- users 테이블 내에서 서브쿼리로 university_id 조회 시 무한 재귀 발생
- 트리거는 `auth.uid() IS NULL`(service_role/postgres)일 때 bypass → admin RPC, 온보딩에 영향 없음

### 스토리 만료 Cron Job 불필요
**결정:** 별도 Cron Job 없이 쿼리 조건(`expires_at > now()`)으로만 처리
**이유:** 모든 스토리 조회 API가 이미 만료 필터를 포함하고 있어 실제 삭제 없어도 동작에 문제 없음

### kookmin.ac.kr MVP 하드코딩 유지
**결정:** `signUpWithPassword`의 도메인 체크 하드코딩(`domain !== "kookmin.ac.kr"`) MVP에서 유지
**이유:** 다른 학교 추가 시점에 universities 테이블 조회 방식으로 전환. 지금 바꿔봐야 검증할 학교가 없음

---

## 2026-08-07

### 전체공개 = 전국공개 / 탐색 = 전국 발견 / 기관계정 = 학교 local
**결정:**
- 게시물·스토리 `visibility='public'`(전체공개)의 의미 = **전국공개**(다른 학교 유저도 열람 가능).
- **홈피드 = 내 학교 로컬**(전교생 + 크루, 관계 중심) — 그대로.
- **탐색 = 전국 발견**(모든 학교의 public 글). 탐색은 원래 타 학교 콘텐츠 발견용.
- **동아리/학생회(`official_accounts`) 글 = 자기 학교만**(public이어도 기관 계정은 school-local).
- `close_friends`(크루공개) = 크루만, 변화 없음.

**이유:**
- 홈=관계(같은 학교), 탐색=발견(전국)으로 목적을 분리해야 탐색이 의미 있음. 같은 학교끼리만이면 홈피드와 중복.
- 현재 탐색의 "같은 학교"는 명시 조건이 아니라 `posts` RLS(SECURITY INVOKER)에서 자동으로 오던 것. 크로스스쿨은 오히려 RLS 우회(SECURITY DEFINER)가 필요.

**타이밍/영향:**
- 지금은 국민대만 있어 실질 효과 없음 → 당장 RLS 변경 불필요. 탐색 알고리즘만 **school-agnostic**(스코프 파라미터, default=같은 학교)로 설계.
- 다학교 확장 시 켠다: `posts` RLS를 public=전 학교 SELECT 허용으로 조정 + 보안 검토, 기관 계정 school-local 필터, 공개범위 선택기 UX("전체공개=전국공개" 명확화).
