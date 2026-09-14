import { createThemeBindings } from "./theme/ThemeProvider";

// 새로 만드는 컴포넌트·화면은 반드시 이 토큰을 사용한다.
// 기존 파일은 그 파일을 수정할 일이 생겼을 때 함께 교체한다(일괄 교체는 하지 않는다).
export const lightColors = {
  accent: "#15161B",
  accentBorderSoft: "rgba(20,22,30,0.1)",
  accentSoft: "#F2F2F7",
  accentTintBg: "rgba(20,22,30,0.05)",
  accentTrack: "#15161B",
  avatarGlyph: "#A1A1AA",
  black: "#000000",
  brand: "#7C3AED",
  border: "rgba(20,22,30,0.08)",
  card: "rgba(255,255,255,0.9)",
  chipFill: "#EFEFEF",
  danger: "#FF3B4E",
  dangerSolid: "rgba(255,59,78,0.92)",
  dangerText: "#FECACA",
  dangerTint: "rgba(255,59,78,0.16)",
  feedCard: "#FFFFFF",
  imagePlaceholder: "#E5E5EA",
  lavenderBorder: "rgba(20,22,30,0.08)",
  lavenderTint: "#E5E5EA",
  lavenderTintSoft: "#F5F5F7",
  mediaControlBg: "rgba(21,22,27,0.72)",
  mediaSheet: "#121214",
  mediaSheetElevated: "#09090B",
  mediaSheetGlass: "rgba(10,10,12,0.86)",
  mediaSheetGlassSoft: "rgba(22,22,26,0.96)",
  muted: "#6B6E7B",
  navBackground: "#FFFFFF",
  navBar: "#FFFFFF",
  neutralFill: "#F4F4F5",
  onAccent: "#FFFFFF",
  onMediaBorder: "rgba(255,255,255,0.8)",
  onMediaBorderFaint: "rgba(255,255,255,0.24)",
  onMediaFill: "rgba(255,255,255,0.28)",
  onMediaFillFaint: "rgba(255,255,255,0.12)",
  onMediaFillStrong: "rgba(255,255,255,0.95)",
  onMediaGlyph: "rgba(255,255,255,0.92)",
  onMediaText: "rgba(255,255,255,0.76)",
  onMediaTextFaint: "rgba(255,255,255,0.4)",
  onMediaTextStrong: "rgba(255,255,255,0.86)",
  overlayInk: "rgba(20,22,30,0.1)",
  overlayInkFaint: "rgba(20,22,30,0.06)",
  overlayInkStrong: "rgba(20,22,30,0.18)",
  scrimHeavy: "rgba(0,0,0,0.75)",
  scrimMed: "rgba(0,0,0,0.45)",
  scrimStrong: "rgba(0,0,0,0.6)",
  scrimWeak: "rgba(0,0,0,0.3)",
  skeleton: "#E4E4E7",
  star: "#FACC15",
  success: "#2FC36B",
  surfaceBorder: "rgba(255,255,255,0.7)",
  surfaceGlass: "rgba(255,255,255,0.82)",
  surfaceGlassSoft: "rgba(255,255,255,0.6)",
  switchThumb: "#FFFFFF",
  switchTrackOff: "rgba(154,157,168,0.36)",
  text: "#15161B",
  textFaint: "#9A9DA8",
  white: "#FFFFFF",
} as const;

export type ThemeColors = typeof lightColors;

export const darkColors = {
  accent: "#FFFFFF",
  accentBorderSoft: "rgba(255,255,255,0.16)",
  accentSoft: "#000000",
  accentTintBg: "rgba(255,255,255,0.08)",
  accentTrack: "#FFFFFF",
  avatarGlyph: "#8E8E93",
  black: "#000000",
  brand: "#7C3AED",
  border: "rgba(255,255,255,0.12)",
  card: "rgba(15,16,17,0.94)",
  chipFill: "#1e1e1f",
  danger: "#FF3B4E",
  dangerSolid: "rgba(255,59,78,0.92)",
  dangerText: "#FECACA",
  dangerTint: "rgba(255,59,78,0.16)",
  feedCard: "#0F1011",
  imagePlaceholder: "#3A3B3C",
  lavenderBorder: "rgba(255,255,255,0.12)",
  lavenderTint: "#3A3B3C",
  lavenderTintSoft: "#242526",
  mediaControlBg: "rgba(21,22,27,0.72)",
  mediaSheet: "#121214",
  mediaSheetElevated: "#09090B",
  mediaSheetGlass: "rgba(10,10,12,0.86)",
  mediaSheetGlassSoft: "rgba(22,22,26,0.96)",
  muted: "#B0B3B8",
  navBackground: "#0F1011",
  navBar: "#0F1011",
  neutralFill: "#242526",
  onAccent: "#15161B",
  onMediaBorder: "rgba(255,255,255,0.8)",
  onMediaBorderFaint: "rgba(255,255,255,0.24)",
  onMediaFill: "rgba(255,255,255,0.28)",
  onMediaFillFaint: "rgba(255,255,255,0.12)",
  onMediaFillStrong: "rgba(255,255,255,0.95)",
  onMediaGlyph: "rgba(255,255,255,0.92)",
  onMediaText: "rgba(255,255,255,0.76)",
  onMediaTextFaint: "rgba(255,255,255,0.4)",
  onMediaTextStrong: "rgba(255,255,255,0.86)",
  overlayInk: "rgba(255,255,255,0.12)",
  overlayInkFaint: "rgba(255,255,255,0.06)",
  overlayInkStrong: "rgba(255,255,255,0.2)",
  scrimHeavy: "rgba(0,0,0,0.75)",
  scrimMed: "rgba(0,0,0,0.45)",
  scrimStrong: "rgba(0,0,0,0.6)",
  scrimWeak: "rgba(0,0,0,0.3)",
  skeleton: "#3A3B3C",
  star: "#FACC15",
  success: "#2FC36B",
  surfaceBorder: "rgba(84,84,88,0.5)",
  surfaceGlass: "rgba(42,43,45,0.82)",
  surfaceGlassSoft: "rgba(58,59,60,0.6)",
  switchThumb: "#FFFFFF",
  switchTrackOff: "rgba(120,120,128,0.32)",
  text: "#E4E6EB",
  textFaint: "#8A8D91",
  white: "#FFFFFF",
} as const satisfies Record<keyof ThemeColors, string>;

// 하위호환: 아직 전환하지 않은 파일은 라이트 팔레트를 계속 사용한다.
export const colors = lightColors;

const themeBindings = createThemeBindings<ThemeColors>({
  darkColors: darkColors as unknown as ThemeColors,
  lightColors,
});

export const ThemeProvider = themeBindings.ThemeProvider;
export const useTheme = themeBindings.useTheme;
export const useThemedStyles = themeBindings.useThemedStyles;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  screenX: 16,
} as const;

export const fontSize = {
  micro: 9,
  tiny: 10,
  footnote: 11,
  label: 12,
  caption: 13,
  bodySmall: 14,
  body: 15,
  bodyLarge: 16,
  titleSmall: 17,
  title: 18,
  heading: 20,
  headingLarge: 22,
  displaySmall: 24,
  displayMedium: 26,
  displayLarge: 28,
  display: 32,
} as const;

export const fontWeight = {
  normal: "400",
  regular: "500",
  medium: "600",
  semibold: "700",
  bold: "800",
  heavy: "900",
} as const;

// 아이콘 크기·굵기 단일 소스. 새 화면은 반드시 이 토큰을 쓴다.
//
// 의도: 굵기 thin(2)은 2026-07-03 "인스타식 축소"로 2.6에서 내린 값이다.
// 피드 액션·홈 헤더·탭바·릴스가 여기 해당하며 되돌리지 말 것.
// 릴스는 원래 1.8이었으나 thin(2)과 눈에 띄는 차이가 없어 2026-09-14에 흡수했다.
//
// 여기 없는 값(더블탭 하트 96·strokeWidth 0, 빈 상태 일러스트 62)은
// 아이콘이 아니라 그림에 가까워 의도적으로 토큰 밖에 둔다.
export const iconSize = {
  xs: 14, // 메타 정보 옆 (기존 12~15)
  sm: 18, // 목록 행, 작은 버튼 (기존 16~19)
  md: 22, // 기본 (기존 20~23)
  lg: 26, // 헤더, 게시물 액션 (기존 24~27)
  xl: 30, // 카메라 조작 (기존 28~30)
} as const;

export const iconStroke = {
  // 의도: 어두운 영상 위(릴스)는 더 얇아야 한다. 2026-09-14에 thin(2)으로
  // 흡수했다가 실기기에서 두꺼워 보여 되돌렸다. thin 과 합치지 말 것.
  hairline: 1.8,
  thin: 2, // 피드·헤더·탭바·카메라 — 2026-07-03 결정
  regular: 2.4, // 기본
  bold: 2.8, // 닫기 X, 체크 등 강조
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  full: 999,
} as const;

// 닉네임 텍스트 공통 스타일 — 색·굵기 단일 소스. 크기는 각 사용처에서 지정하고,
// 어두운 배경(릴스/스토리)은 color만 흰색으로 덮는다. 닉네임 굵기 변경은 여기 한 곳만.
export const nicknameTextStyle = {
  color: colors.text,
  fontWeight: "700",
} as const;
