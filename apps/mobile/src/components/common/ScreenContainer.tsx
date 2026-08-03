import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../lib/theme";

type SafeAreaEdge = "top" | "right" | "bottom" | "left";

type ScreenContainerProps = PropsWithChildren<{
  contentBackgroundColor?: string;
  edges?: SafeAreaEdge[];
  style?: StyleProp<ViewStyle>;
}>;

export function ScreenContainer({
  children,
  contentBackgroundColor,
  edges = ["top"],
  style,
}: ScreenContainerProps) {
  const resolvedBackgroundColor = contentBackgroundColor ?? colors.accentSoft;

  return (
    <View style={[styles.root, { backgroundColor: resolvedBackgroundColor }]}>
      <SafeAreaView
        edges={edges}
        style={[
          styles.content,
          { backgroundColor: resolvedBackgroundColor },
          style,
        ]}
      >
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
