# COLOR TOKENS — 색 토큰화 설계 (1단계: 무변화 치환)

> 목적: 코드 곳곳에 하드코딩된 색(hex/rgba)을 `apps/mobile/src/lib/theme.ts`의
> **의미 기반 토큰(semantic token)** 하나로 모은다.
> **이 단계에서 화면은 100% 무변화** — 값은 지금 그대로, "이름"만 붙인다.
> 이후 2단계에서 값을 회색/애플 팔레트로 바꾸거나 다크모드를 붙일 때 **여기 한 곳만** 고치면 된다.

## 원칙
1. **무변화**: 이 PR에서 눈에 보이는 색 변화 0. (scrim/흰오버레이의 "거의 같은 알파"만 단계로 통일 — 육안 식별 불가 수준)
2. **역할 기반**: 토큰 이름은 "무슨 색"이 아니라 "무슨 용도"로 짓는다. (`text`, `surface`, `scrim` …)
3. **flip / fixed 태그** — 다크모드 대비의 핵심.
   - `flip` = 라이트/다크에서 값이 뒤집히는 앱 UI(글씨·배경·테두리)
   - `fixed` = 테마 무관하게 고정(영상/사진 위 오버레이, 상태색, 브랜드)
   - **⚠️ 같은 raw 값이라도 역할이 flip인지 fixed인지 다르면 반드시 다른 토큰.**
     예: `#FFF`가 "페이지 배경"이면 flip(`surface`), "영상 위 흰 아이콘"이면 fixed(`white`).
4. **범위**: `apps/mobile/src` 전체. `theme.ts` 정의부 제외. 아래 "제외 목록" 제외.

---

## 1. 토큰 정의

### 기존 토큰 (theme.ts에 이미 있음 — 값 유지)
| 토큰 | 값 | flip/fixed | 용도 |
|---|---|---|---|
| `text` | #15161B | flip | 본문 검은 글씨 |
| `muted` | #6B6E7B | flip | 회색 보조 글씨 |
| `textFaint` | #9A9DA8 | flip | 더 흐린 글씨 |
| `accent` | #7C3AED | flip* | 브랜드 보라 (2단계에서 회색으로 교체 예정) |
| `accentSoft` | #EEE9FB | flip | 앱 라벤더 배경 |
| `navBackground` | #FFFFFF | flip | 솔리드 흰 표면 |
| `card` | rgba(255,255,255,0.9) | flip | 반투명 흰 카드 |
| `border` | rgba(20,22,30,0.08) | flip | 기본 잉크 테두리 |
| `imagePlaceholder` | #E8E3F3 | flip | 이미지 로딩 자리 |
| `danger` | #FF3B4E | fixed | 위험/삭제 빨강 |
| `black` | #000000 | fixed | 릴스/미디어 검정 배경 |
| `white` | #FFFFFF | fixed | 미디어 위 흰색(아이콘/글씨 기본) |

### 신규 토큰 — flip (앱 UI, 다크모드에서 뒤집힘)
| 토큰 | 값(현재값 유지) | 용도 |
|---|---|---|
| `surfaceGlass` | rgba(255,255,255,0.82) | 반투명 유리 표면(카드보다 진함) |
| `surfaceGlassSoft` | rgba(255,255,255,0.6) | 약한 유리 표면 |
| `surfaceBorder` | rgba(255,255,255,0.7) | 유리 표면 테두리 (최다 사용) |
| `neutralFill` | #F4F4F5 | 썸네일/그리드 빈 배경 |
| `skeleton` | #E4E4E7 | 스켈레톤/아바타 배경 |
| `avatarGlyph` | #A1A1AA | 아바타 기본 실루엣 |
| `lavenderTint` | #D8CCF2 | 연보라 표면(스토리바 등) |
| `lavenderTintSoft` | #F7F5FB | 아주 연한 라벤더(댓글 입력) |
| `lavenderBorder` | #D9CCFA | 연보라 테두리 |
| `accentTintBg` | rgba(124,58,237,0.08) | 액센트 연한 배경 채움 |
| `accentBorderSoft` | rgba(124,58,237,0.16) | 액센트 연한 테두리 |
| `accentTrack` | rgba(124,58,237,0.36) | 스위치 ON 트랙 |
| `overlayInkFaint` | rgba(20,22,30,0.06) | 밝은 표면 위 아주 옅은 잉크 |
| `overlayInk` | rgba(20,22,30,0.1) | 밝은 표면 위 옅은 잉크 |
| `overlayInkStrong` | rgba(20,22,30,0.18) | 밝은 표면 위 잉크 |

### 신규 토큰 — fixed (미디어 위/상태색, 테마 무관)
| 토큰 | 값 | 용도 |
|---|---|---|
| `scrimWeak` | rgba(0,0,0,0.3) | 미디어 위 옅은 검정막 (0.24~0.38 통일) |
| `scrimMed` | rgba(0,0,0,0.45) | 모달 dim·중간 검정막·텍스트그림자 (0.40~0.50 통일) |
| `scrimStrong` | rgba(0,0,0,0.6) | 진한 검정막 (0.55~0.66 통일) |
| `scrimHeavy` | rgba(0,0,0,0.75) | 매우 진한 검정막 (0.72~0.78 통일) |
| `onMediaTextStrong` | rgba(255,255,255,0.86) | 미디어 위 흰 글씨(진함) |
| `onMediaText` | rgba(255,255,255,0.76) | 미디어 위 흰 글씨(보통, 0.72~0.78 통일) |
| `onMediaTextFaint` | rgba(255,255,255,0.4) | 미디어 위 흰 글씨(흐림, 0.38~0.6 통일) |
| `onMediaFillFaint` | rgba(255,255,255,0.12) | 미디어 위 흰 채움(옅음, 0.10~0.14 통일) |
| `onMediaFill` | rgba(255,255,255,0.28) | 미디어 위 흰 채움/트랙 (0.22~0.34 통일) |
| `onMediaFillStrong` | rgba(255,255,255,0.95) | 미디어 위 흰 진행바 |
| `onMediaGlyph` | rgba(255,255,255,0.92) | 미디어 위 흰 아이콘(재생 등) |
| `onMediaBorder` | rgba(255,255,255,0.8) | 미디어 위 흰 테두리 |
| `onMediaBorderFaint` | rgba(255,255,255,0.24) | 미디어 위 흰 테두리(옅음) |
| `mediaControlBg` | rgba(21,22,27,0.72) | 미디어 위 어두운 컨트롤 배경 |
| `mediaSheet` | #121214 | 스토리/활동 풀스크린 어두운 표면 |
| `mediaSheetElevated` | #09090B | 위 표면 위 더 어두운 층 |
| `mediaSheetGlass` | rgba(10,10,12,0.86) | 어두운 반투명 시트 |
| `mediaSheetGlassSoft` | rgba(22,22,26,0.96) | 어두운 반투명 시트(스토리) |
| `dangerSolid` | rgba(255,59,78,0.92) | 녹화 버튼 등 진한 위험색 |
| `dangerTint` | rgba(255,59,78,0.16) | 위험 연한 배경 (0.14~0.18 통일) |
| `dangerText` | #FECACA | 위험 연분홍 글씨 |
| `star` | #FACC15 | 즐겨찾기 별 노랑 |
| `success` | #2FC36B | 인사이트 상승 초록 |

---

## 2. 값 → 토큰 매핑 (Codex가 이 표대로 치환)

> 규칙: 왼쪽 raw 값을 `colors.토큰`으로 교체. **대소문자/공백 무시하고 매칭.**
> 한 값이 여러 파일에 있어도 같은 토큰이면 전부 동일 치환.

### flip
| raw 값 | → 토큰 |
|---|---|
| rgba(255,255,255,0.7) | `surfaceBorder` |
| rgba(255,255,255,0.72) | `surfaceBorder` |
| rgba(255,255,255,0.82) | `surfaceGlass` |
| rgba(255,255,255,0.86) | `surfaceGlass` |
| rgba(255,255,255,0.6) | `surfaceGlassSoft` |
| rgba(255,255,255,0.55) | `surfaceGlassSoft` |
| #F4F4F5 | `neutralFill` |
| #E4E4E7 | `skeleton` |
| #A1A1AA | `avatarGlyph` |
| #D8CCF2 | `lavenderTint` |
| #DDD6FE | `lavenderTint` |
| #D8D4E2 | `lavenderTint` |
| #F7F5FB | `lavenderTintSoft` |
| #D9CCFA | `lavenderBorder` |
| rgba(124,58,237,0.06) | `accentTintBg` |
| rgba(124,58,237,0.08) | `accentTintBg` |
| rgba(124,58,237,0.12) | `accentTintBg` |
| rgba(124,58,237,0.1) | `accentBorderSoft` |
| rgba(124,58,237,0.16) | `accentBorderSoft` |
| rgba(124,58,237,0.18) | `accentBorderSoft` |
| rgba(124,58,237,0.22) | `accentBorderSoft` |
| rgba(124,58,237,0.36) | `accentTrack` |
| rgba(20,22,30,0.04) | `overlayInkFaint` |
| rgba(20,22,30,0.06) | `overlayInkFaint` |
| rgba(20,22,30,0.07) | `overlayInkFaint` |
| rgba(20,22,30,0.18) | `overlayInkStrong` |

### fixed
| raw 값 | → 토큰 |
|---|---|
| rgba(0,0,0,0.24) / 0.26 / 0.28 / 0.32 / 0.34 / 0.35 / 0.38 | `scrimWeak` |
| rgba(0,0,0,0.4) / 0.42 / 0.45 / 0.48 / 0.5 | `scrimMed` |
| rgba(0,0,0,0.55) / 0.58 / 0.66 | `scrimStrong` |
| rgba(0,0,0,0.72) / 0.78 | `scrimHeavy` |
| rgba(255,255,255,0.86) *(글씨)* | `onMediaTextStrong` |
| rgba(255,255,255,0.72) / 0.75 / 0.78 *(글씨)* | `onMediaText` |
| rgba(255,255,255,0.38) / 0.42 / 0.6 *(글씨)* | `onMediaTextFaint` |
| rgba(255,255,255,0.1) / 0.14 | `onMediaFillFaint` |
| rgba(255,255,255,0.22) / 0.25 / 0.3 / 0.32 / 0.34 | `onMediaFill` |
| rgba(255,255,255,0.95) | `onMediaFillStrong` |
| rgba(255,255,255,0.92) | `onMediaGlyph` |
| rgba(255,255,255,0.8) | `onMediaBorder` |
| rgba(255,255,255,0.24) | `onMediaBorderFaint` |
| rgba(255,255,255,0.85) | `onMediaBorder` |
| rgba(21,22,27,0.72) | `mediaControlBg` |
| #121214 | `mediaSheet` |
| #09090B | `mediaSheetElevated` |
| rgba(10,10,12,0.86) | `mediaSheetGlass` |
| rgba(22,22,26,0.96) | `mediaSheetGlassSoft` |
| rgba(255,59,78,0.92) | `dangerSolid` |
| rgba(255,59,78,0.14) / 0.18 | `dangerTint` |
| #FECACA | `dangerText` |
| #FACC15 | `star` |
| #2FC36B | `success` |
| #fff / #FFFFFF *(미디어 위 아이콘·글씨)* | `white` |
| #000000 *(릴스/미디어 배경)* | `black` |

### ⚠️ 문맥 확인 필요 (raw 값 같은데 역할이 갈릴 수 있음 — Codex는 파일 열어 판단)
- **rgba(255,255,255,0.86)**: `MessageBubble.tsx:277` 글씨 → `onMediaTextStrong`.
  `ExploreScreen.tsx:275` 배경 → `surfaceGlass`. (값 같지만 토큰 다름)
- **rgba(255,255,255,0.25)**: 어두운 배경 위(StoryCamera) → `onMediaFill`.
  밝은 화면 위(MessagesScreen)면 → `surfaceGlass` 계열. 파일 배경색 보고 판단.
- **rgba(0,0,0,0.5)**: 텍스트 그림자(ReelActions/ReelFooter)·그라디언트·dim 모두 `scrimMed`로 OK.

---

## 3. 제외 목록 (절대 토큰화 금지)
| 위치 | 이유 |
|---|---|
| `components/auth/GoogleAuthButton.tsx` (#4285F4/#34A853/#FBBC05/#EA4335/#422B66, rgba(20,22,30,0.1) 테두리 포함) | **구글 브랜드색** — 규정상 고정. 컴포넌트 통째로 손대지 말 것 |
| `features/stories/backgroundColors.ts` (#000000/#1C1C1E/#3A3A3C/#AEAEB2/#FFFFFF) | **스토리 배경 팔레트 = 유저가 고르는 콘텐츠 색**. UI색 아님 |
| `screens/stories/StoryCreateScreen.tsx:186` `color === "#FFFFFF"` | 위 팔레트 값 **비교 로직** (스타일 아님) |

---

## 4. 작업 순서 (Codex)
1. `theme.ts`의 `colors`에 위 **신규 토큰 전부 추가**(값은 표 그대로). 기존 토큰은 그대로 둠.
2. 매핑표대로 `apps/mobile/src` 전체에서 raw 색 → `colors.토큰` 치환.
   - `StyleSheet.create` 안의 문자열 리터럴, 컴포넌트 prop(`color=`, `fill=`, `colors={[…]}`) 모두 포함.
   - 이미 `colors.xxx` 쓰는 곳은 건드리지 않음.
3. "제외 목록"은 손대지 않음.
4. "문맥 확인 필요" 3건은 파일 열어 배경 맥락 보고 토큰 선택.
5. `npx tsc --noEmit` 통과 확인.
6. **셀프 체크**: raw hex/rgba 잔여 검색해서 제외 목록 외에 남은 게 없는지 확인.

## 5. 검증 (사람)
- 앱 실행 후 주요 화면(홈피드/릴스/스토리/프로필/채팅/작성/탐색/활동/설정) 눈으로 훑어 **색 변화 없음** 확인.
- scrim/흰오버레이 통일로 인한 미세 차이는 의도된 것(육안 식별 불가).

---
*2단계(값 교체 → 회색/애플 팔레트) 및 3단계(다크모드 런타임 전환, `StyleSheet.create` → 테마 훅 구조 변경)는 별도 문서로 진행.*
