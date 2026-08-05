import Svg, { Circle, Path } from "react-native-svg";

import { PROMOTED_SEAL } from "./badgeSpec";

type PromotedBadgeProps = {
  isDark: boolean;
  size?: number;
};

// 승격 배지 — 6엽 씰 심볼. 색은 브랜드 고정(라이트/다크만 분기).
export function PromotedBadge({ isDark, size = 15 }: PromotedBadgeProps) {
  const tone = isDark ? PROMOTED_SEAL.dark : PROMOTED_SEAL.light;

  return (
    <Svg
      accessibilityLabel="승격"
      accessibilityRole="image"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <Path d={PROMOTED_SEAL.path} fill={tone.fill} />
      <Circle cx={12} cy={12} fill={tone.dot} r={2.6} />
    </Svg>
  );
}
