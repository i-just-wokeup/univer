import { StyleSheet, Text, View } from "react-native";

import type { AccountAffiliation } from "../../../features/verified/api";
import { AFFILIATION_PILL, PILL_METRICS } from "./badgeSpec";

type AffiliationPillProps = {
  affiliation: AccountAffiliation;
  isDark: boolean;
};

// 소속 배지 — 학생회/동아리 텍스트 pill. 무채색(라이트/다크만 분기).
export function AffiliationPill({ affiliation, isDark }: AffiliationPillProps) {
  const spec = AFFILIATION_PILL[affiliation];
  const tone = isDark ? spec.dark : spec.light;
  const hasBorder = tone.border !== "transparent";

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: tone.bg,
          borderColor: tone.border,
          borderWidth: hasBorder ? 1 : 0,
        },
      ]}
    >
      <Text style={[styles.text, { color: tone.text }]}>{spec.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: PILL_METRICS.height,
    borderRadius: PILL_METRICS.radius,
    paddingHorizontal: PILL_METRICS.paddingHorizontal,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: PILL_METRICS.fontSize,
    fontWeight: "600",
    letterSpacing: PILL_METRICS.letterSpacing,
    lineHeight: 12,
  },
});
