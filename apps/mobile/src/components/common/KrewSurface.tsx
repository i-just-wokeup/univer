import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors } from "../../lib/theme";

type KrewSurfaceProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// 웹 KREW Surface(rounded-22 / white82 / white70 border) 대응 흰 카드 패널.
export function KrewSurface({ children, style }: KrewSurfaceProps) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceGlass,
  },
});
