import type { AccountAffiliation } from "../../../features/verified/api";

// unip 계정 배지 확정 디자인값(단일 소스).
// 브랜드 고정색이라 팔레트 토큰과 별개로 둔다(로고와 동일 원칙). 라이트/다크만 분기.

export const PROMOTED_SEAL = {
  // 6엽 씰. viewBox 24×24, 중심(12,12) 회전 대칭.
  path: "M19.45 7.7A4.41 4.41 0 0 0 12 3.4A4.41 4.41 0 0 0 4.55 7.7A4.41 4.41 0 0 0 4.55 16.3A4.41 4.41 0 0 0 12 20.6A4.41 4.41 0 0 0 19.45 16.3A4.41 4.41 0 0 0 19.45 7.7Z",
  light: { dot: "#FFFFFF", fill: "#8B1E2D" },
  dark: { dot: "#17191D", fill: "#C85A66" },
} as const;

type PillTone = { bg: string; border: string; text: string };

export const AFFILIATION_PILL: Record<
  AccountAffiliation,
  { label: string; light: PillTone; dark: PillTone }
> = {
  // 학생회 = 솔리드 채움(다크는 흰↔잉크 반전). 무채색.
  council: {
    label: "학생회",
    light: { bg: "#22252A", border: "transparent", text: "#FFFFFF" },
    dark: { bg: "#FFFFFF", border: "transparent", text: "#16181C" },
  },
  // 동아리 = 연한 채움 + 1px 테두리. 무채색.
  club: {
    label: "동아리",
    light: { bg: "#E4E6EA", border: "#D2D6DC", text: "#4A4F57" },
    dark: { bg: "#2A2E34", border: "#3C424A", text: "#C3C8D0" },
  },
};

// pill 공통 치수(높이 18 / 반경 9 / 폰트 10·600).
export const PILL_METRICS = {
  height: 18,
  radius: 9,
  paddingHorizontal: 7,
  fontSize: 10,
  letterSpacing: -0.1,
} as const;
