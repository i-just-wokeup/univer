import { StyleSheet, View } from "react-native";

import type { AccountBadge as AccountBadgeData } from "../../features/verified/api";
import { useTheme } from "../../lib/theme";
import { AffiliationPill } from "./badge/AffiliationPill";
import { PromotedBadge } from "./badge/PromotedBadge";

type AccountBadgeProps = {
  badge: AccountBadgeData | null;
  // full = 소속 pill + 승격 심볼 / symbol = 승격 심볼만(댓글·DM)
  variant?: "full" | "symbol";
  symbolSize?: number;
  // 어두운 미디어(릴스 등) 위에선 앱 테마와 무관하게 다크 색으로 고정.
  forceScheme?: "light" | "dark";
};

// 닉네임 뒤에 붙는 계정 배지. 소속 pill과 승격 심볼을 규칙대로(소속→승격) 나열만 한다.
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
      {showSeal ? <PromotedBadge isDark={isDark} size={sealSize} /> : null}
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
});
