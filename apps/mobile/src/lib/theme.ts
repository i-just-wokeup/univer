// 새로 만드는 컴포넌트·화면은 반드시 이 토큰을 사용한다.
// 기존 파일은 그 파일을 수정할 일이 생겼을 때 함께 교체한다(일괄 교체는 하지 않는다).
export const colors = {
  accent: "#7C3AED",
  accentBorderSoft: "rgba(124,58,237,0.16)",
  accentSoft: "#EEE9FB",
  accentTintBg: "rgba(124,58,237,0.08)",
  accentTrack: "rgba(124,58,237,0.36)",
  avatarGlyph: "#A1A1AA",
  black: "#000000",
  border: "rgba(20,22,30,0.08)",
  card: "rgba(255,255,255,0.9)",
  danger: "#FF3B4E",
  dangerSolid: "rgba(255,59,78,0.92)",
  dangerText: "#FECACA",
  dangerTint: "rgba(255,59,78,0.16)",
  imagePlaceholder: "#E8E3F3",
  lavenderBorder: "#D9CCFA",
  lavenderTint: "#D8CCF2",
  lavenderTintSoft: "#F7F5FB",
  mediaControlBg: "rgba(21,22,27,0.72)",
  mediaSheet: "#121214",
  mediaSheetElevated: "#09090B",
  mediaSheetGlass: "rgba(10,10,12,0.86)",
  mediaSheetGlassSoft: "rgba(22,22,26,0.96)",
  muted: "#6B6E7B",
  navBackground: "#FFFFFF",
  neutralFill: "#F4F4F5",
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
  switchTrackOff: "rgba(154,157,168,0.36)",
  text: "#15161B",
  textFaint: "#9A9DA8",
  white: "#FFFFFF",
} as const;

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
  label: 12,
  caption: 13,
  body: 15,
  title: 18,
  display: 32,
} as const;

export const fontWeight = {
  medium: "600",
  bold: "800",
  heavy: "900",
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
