// 새로 만드는 컴포넌트·화면은 반드시 이 토큰을 사용한다.
// 기존 파일은 그 파일을 수정할 일이 생겼을 때 함께 교체한다(일괄 교체는 하지 않는다).
export const colors = {
  accent: "#7C3AED",
  accentSoft: "#EEE9FB",
  black: "#000000",
  border: "rgba(20,22,30,0.08)",
  card: "rgba(255,255,255,0.9)",
  danger: "#FF3B4E",
  imagePlaceholder: "#E8E3F3",
  muted: "#6B6E7B",
  navBackground: "#FFFFFF",
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
