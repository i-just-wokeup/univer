# DARK MODE — 3단계: 라이트/다크 런타임 전환 (시스템 따라가기)

> 전제: 1단계(토큰화)·2단계(모노 값) 완료. 색은 전부 `theme.ts` 토큰을 거친다.
> 이 단계 = **색을 "앱 켤 때 한 번 굳히기" → "화면 그릴 때마다 현재 테마로 칠하기"** 로 배선 교체.
> **v1 범위: 폰 시스템 테마 자동 따라가기만.** 수동 토글은 이후(배선 재사용, 반나절).
> **라이브러리 없음** — 자체 `ThemeProvider`/`useTheme`(네이티브 리스크 회피).

## 핵심 원칙
1. **점진적**: 배선부터 깔고 화면 그룹별로 전환. **안 바꾼 화면은 계속 라이트로 정상 작동** → 중간에 앱 안 깨짐. 각 단계가 독립 커밋(안전지점).
2. **flip / fixed**: `COLOR_TOKENS.md`의 태그 그대로. **flip 토큰만 다크값**을 갖는다. **fixed 토큰(영상·사진 위 오버레이·상태색)은 라이트=다크 동일**.
3. **하위호환**: 전환 안 된 파일은 기존 `import { colors }`(=라이트 고정)를 그대로 써서 항상 라이트로 렌더. 전환 완료 파일만 테마를 탄다.

---

## 1. 아키텍처

### theme.ts 재구성
```ts
export const lightColors = { /* 지금 colors 값 그대로 */ } as const;
export const darkColors  = { /* 아래 다크값 표 */ } as const;
export type ThemeColors = typeof lightColors;

// 하위호환: 전환 안 된 파일이 계속 쓰는 라이트 고정 export
export const colors = lightColors;
```
- `lightColors`/`darkColors`는 **키가 완전히 동일**해야 한다(같은 토큰 이름).
- spacing/fontSize/radius 등 비색상 토큰은 그대로.

### 신규 파일 `src/lib/theme/ThemeProvider.tsx`
- `useColorScheme()`(react-native)로 현재 시스템 테마 구독 → `light`면 `lightColors`, `dark`면 `darkColors` 제공.
- `null`(불명)일 때 기본은 `light`.
- Context로 `{ colors, scheme }` 노출. 루트(`app/_layout.tsx`)에서 앱 전체를 감싼다.

### 신규 훅 `useTheme()` / `useThemedStyles()`
```ts
const { colors, scheme } = useTheme();               // JSX 인라인 색용
const styles = useThemedStyles(makeStyles);          // StyleSheet용 (scheme로 memo)
```

### 파일 전환 규칙 (Codex가 반복 적용)
전환 전:
```ts
import { colors } from "../../lib/theme";
const styles = StyleSheet.create({ box: { backgroundColor: colors.accentSoft } });
export function Foo() { return <View style={styles.box}><Icon color={colors.accent}/></View>; }
```
전환 후:
```ts
import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
const makeStyles = (c: ThemeColors) => StyleSheet.create({ box: { backgroundColor: c.accentSoft } });
export function Foo() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();                      // JSX 인라인 색이 있을 때만
  return <View style={styles.box}><Icon color={colors.accent}/></View>;
}
```
규칙:
- 모듈 최상단 `StyleSheet.create({...})` → `const makeStyles = (c: ThemeColors) => StyleSheet.create({...})`, 내부 `colors.X` → `c.X`.
- 컴포넌트 안에서 `const styles = useThemedStyles(makeStyles);`.
- JSX 인라인 `colors.X`(예: `color=`, `fill=`, `tintColor=`, 그라디언트 `colors={[...]}`)가 있으면 `const { colors } = useTheme();` 추가 후 그대로.
- **레이아웃/숫자만 있는 StyleSheet(색 토큰 0개)는 전환 불필요** — 그대로 둔다.
- 색 상수를 모듈 스코프에서 쓰던 곳(예: `const UP=colors.success`)은 컴포넌트 안으로 옮기거나 fixed면 그대로.

### 시스템 크롬
- `app.json` `userInterfaceStyle: "light"` → **`"automatic"`**.
- 루트에 `<StatusBar style="auto" />`(expo-status-bar) — 배경 밝기 따라 글자색 자동.
- `NavigationContainer`/expo-router 테마도 scheme에 맞춰 배경 지정(흰 깜빡임 방지).

---

## 2. 다크값 표 (flip 토큰만)

> 라이트값은 현재 `theme.ts` 그대로. 아래는 **추가할 다크값**. (애플 다크 팔레트 기준, 눈대중 초안 — 실기기 보정)

| 토큰 | 라이트(현재) | 다크(추가) | 비고 |
|---|---|---|---|
| `text` | #15161B | `#FFFFFF` | 본문 글씨 |
| `muted` | #6B6E7B | `rgba(235,235,245,0.6)` | 보조 글씨 |
| `textFaint` | #9A9DA8 | `rgba(235,235,245,0.3)` | 흐린 글씨 |
| `accent` | #15161B | `#FFFFFF` | 활성탭·아이콘·링크·스피너. **채운 버튼 배경도 흰색 → 글자색은 `onAccent`로** |
| `accentSoft` | #F2F2F7 | `#1C1C1E` | 앱 배경·상대 말풍선 (진회색 베이스) |
| `accentTintBg` | rgba(20,22,30,0.05) | `rgba(255,255,255,0.08)` | 선택 옵션 배경 |
| `accentBorderSoft` | rgba(20,22,30,0.1) | `rgba(255,255,255,0.16)` | 옅은 테두리 |
| `accentTrack` | #15161B | `#FFFFFF` | 스위치 ON. thumb는 `switchThumb`로(아래 특수처리) |
| `navBackground` | #FFFFFF | `#2C2C2E` | 솔리드 표면/카드 (배경보다 한 톤 위) |
| `card` | rgba(255,255,255,0.9) | `rgba(44,44,46,0.92)` | 반투명 카드 |
| `surfaceGlass` | rgba(255,255,255,0.82) | `rgba(58,58,60,0.82)` | 유리 표면 |
| `surfaceGlassSoft` | rgba(255,255,255,0.6) | `rgba(58,58,60,0.6)` | 약한 유리 표면 |
| `surfaceBorder` | rgba(255,255,255,0.7) | `rgba(84,84,88,0.5)` | 유리 표면 테두리 |
| `border` | rgba(20,22,30,0.08) | `rgba(255,255,255,0.12)` | 기본 테두리 |
| `neutralFill` | #F4F4F5 | `#2C2C2E` | 썸네일 빈 배경 |
| `skeleton` | #E4E4E7 | `#3A3A3C` | 스켈레톤 |
| `imagePlaceholder` | #E5E5EA | `#3A3A3C` | 이미지 로딩 자리 |
| `lavenderTint` | #E5E5EA | `#3A3A3C` | 스토리바 등 |
| `lavenderTintSoft` | #F5F5F7 | `#2C2C2E` | 댓글 입력창 |
| `lavenderBorder` | rgba(20,22,30,0.08) | `rgba(255,255,255,0.12)` | 연한 테두리 |
| `overlayInkFaint` | rgba(20,22,30,0.06) | `rgba(255,255,255,0.06)` | 옅은 오버레이 |
| `overlayInk` | rgba(20,22,30,0.1) | `rgba(255,255,255,0.12)` | 오버레이 |
| `overlayInkStrong` | rgba(20,22,30,0.18) | `rgba(255,255,255,0.2)` | 진한 오버레이 |
| `switchTrackOff` | rgba(154,157,168,0.36) | `rgba(120,120,128,0.32)` | 스위치 OFF 트랙 |
| `avatarGlyph` | #A1A1AA | `#8E8E93` | 아바타 실루엣 |

### fixed 토큰 — 라이트=다크 동일 (다크값 = 라이트값 그대로 복사)
`black`, `white`, `brand`(보라 유지), `scrimWeak/Med/Strong/Heavy`, `onMediaText/Strong/Faint`, `onMediaFill/Faint/Strong`, `onMediaGlyph`, `onMediaBorder/Faint`, `mediaControlBg`, `mediaSheet/Elevated/Glass/GlassSoft`, `danger`, `dangerSolid`, `dangerText`, `dangerTint`, `star`, `success`.
> 영상·사진·릴스·스토리 위 요소와 상태색은 테마 무관하게 그대로.

---

## 3. 특수 처리 (값 교체만으론 안 되는 2곳)
1. **채운 버튼 글자색** — 지금 채운 버튼은 배경 `colors.accent` + 글자 하드코딩 `colors.white`.
   다크에선 배경이 흰색이 되므로 흰 글자가 안 보인다. → **`onAccent` 토큰 신규**(라이트 `#FFFFFF` / 다크 `#15161B`). 채운 버튼의 글자·아이콘 `colors.white`를 `colors.onAccent`로 교체(해당 버튼들만, ~20곳).
2. **스위치 thumb** — `ProfileEditPrivacyToggles`의 `thumbColor={colors.white}`가 다크 ON(흰 트랙)과 겹침.
   → **`switchThumb` 토큰 신규**(라이트 `#FFFFFF` / 다크 `#FFFFFF`)로 두되, ON 트랙 다크값을 `#FFFFFF` 대신 대비되는 톤으로 조정하거나 thumb를 어둡게. 실기기 보고 이 한 컴포넌트만 미세조정.

---

## 4. 점진 전환 순서 (단계별 커밋)
- **Phase 0 — 배선**: theme.ts 분리(light/dark), ThemeProvider/useTheme/useThemedStyles, 루트 감싸기, app.json `automatic`, 루트 StatusBar. **라이트 화면 무변화**(다크는 아직 화면 미전환이라 대부분 라이트로 보임). onAccent/switchThumb 토큰 추가.
- **Phase 1 — 뼈대/공통**: `ScreenContainer`, `BottomTabBar`, `Avatar`, `Skeleton`, `StateView`, `ConfirmDialog`, `ActionSheet`, 홈(HomeScreen/HomeFeedList/HomeHeader), 프로필(ProfileScreen/ProfileContent).
- **Phase 2 — 작성/탐색/검색**: write·explore·search 계열.
- **Phase 3 — 채팅/댓글/스토리/활동/설정/인사이트/인증**: 나머지 화면 그룹.
- 릴스/스토리 뷰어는 원래 항상 다크(fixed) → 배경은 그대로, 텍스트 토큰만 확인.

각 Phase: 전환 → **라이트+다크 둘 다 실기기 확인** → 커밋. 문제 시 해당 Phase만 되돌림.

---

## 5. 검증
- 폰 설정에서 다크 켜고 → 전환된 화면이 어두운 배경/밝은 글씨로 바뀌는지, **fixed(릴스·스토리·상태색)는 그대로**인지.
- 전환 안 된 화면이 라이트로 멀쩡한지(과도기 정상).
- 상태바 글자색, 화면 전환 시 흰 깜빡임 없는지.
- 채운 버튼 글자 보이는지(onAccent), 스위치 ON/OFF 구분되는지.

## 6. 되돌리기
- 각 Phase 독립 커밋 → `git checkout <phase 직전 커밋> -- <해당 파일들>`.
- 배선(Phase 0)만 되돌리면 앱은 다시 라이트 고정으로 완전 복귀(`colors=lightColors` 하위호환 덕분).

*수동 토글(설정 스위치+저장)은 이 배선 위에 이후 추가 — ThemeProvider가 시스템 대신 저장값을 읽게 하고 설정 UI만 붙이면 됨.*
