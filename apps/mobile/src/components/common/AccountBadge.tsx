import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import type { AccountAffiliation, AccountBadge as AccountBadgeData } from "../../features/verified/api";
import { useTheme } from "../../lib/theme";

// 브랜드 확정색이라 팔레트 토큰과 별개로 고정값(라이트/다크만 분기).
const PROMOTED = {
  light: { dot: "#FFFFFF", fill: "#8B1E2D" },
  dark: { dot: "#17191D", fill: "#C85A66" },
};
const SEAL_PATH =
  "M19.45 7.7A4.41 4.41 0 0 0 12 3.4A4.41 4.41 0 0 0 4.55 7.7A4.41 4.41 0 0 0 4.55 16.3A4.41 4.41 0 0 0 12 20.6A4.41 4.41 0 0 0 19.45 16.3A4.41 4.41 0 0 0 19.45 7.7Z";

const PILL = {
  council: {
    label: "학생회",
    light: { bg: "#22252A", border: "transparent", text: "#FFFFFF" },
    dark: { bg: "#FFFFFF", border: "transparent", text: "#16181C" },
  },
  club: {
    label: "동아리",
    light: { bg: "#E4E6EA", border: "#D2D6DC", text: "#4A4F57" },
    dark: { bg: "#2A2E34", border: "#3C424A", text: "#C3C8D0" },
  },
} satisfies Record<AccountAffiliation, unknown>;

type AccountBadgeProps = {
  badge: AccountBadgeData | null;
  // full = 소속 pill + 승격 심볼 / symbol = 승격 심볼만(댓글·DM)
  variant?: "full" | "symbol";
  symbolSize?: number;
  // 어두운 미디어(릴스 등) 위에선 앱 테마와 무관하게 다크 색으로 고정.
  forceScheme?: "light" | "dark";
};

function PromotedSeal({ size, isDark }: { size: number; isDark: boolean }) {
  const tone = isDark ? PROMOTED.dark : PROMOTED.light;
  return (
    <Svg
      accessibilityLabel="승격"
      accessibilityRole="image"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <Path d={SEAL_PATH} fill={tone.fill} />
      <Circle cx={12} cy={12} fill={tone.dot} r={2.6} />
    </Svg>
  );
}

function AffiliationPill({
  affiliation,
  isDark,
}: {
  affiliation: AccountAffiliation;
  isDark: boolean;
}) {
  const spec = PILL[affiliation];
  const tone = isDark ? spec.dark : spec.light;
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: tone.bg,
          borderColor: tone.border,
          borderWidth: tone.border === "transparent" ? 0 : 1,
        },
      ]}
    >
      <Text style={[styles.pillText, { color: tone.text }]}>{spec.label}</Text>
    </View>
  );
}

// 닉네임 뒤에 붙는 계정 배지. 소속 pill과 승격 심볼을 규칙대로(소속→승격) 나열.
export function AccountBadge({
  badge,
  variant = "full",
  symbolSize,
  forceScheme,
}: AccountBadgeProps) {
  const { scheme } = useTheme();
  const isDark = (forceScheme ?? scheme) === "dark";

  if (!badge) {
    return null;
  }

  const showPill = variant === "full" && badge.affiliation !== null;
  const showSeal = badge.promoted;

  if (!showPill && !showSeal) {
    return null;
  }

  const sealSize = symbolSize ?? (variant === "symbol" ? 14 : 15);

  return (
    <View style={styles.row}>
      {showPill && badge.affiliation ? (
        <AffiliationPill affiliation={badge.affiliation} isDark={isDark} />
      ) : null}
      {showSeal ? <PromotedSeal size={sealSize} isDark={isDark} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    transform: [{ translateY: 1 }],
  },
  pill: {
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: -0.1,
    lineHeight: 12,
  },
});
