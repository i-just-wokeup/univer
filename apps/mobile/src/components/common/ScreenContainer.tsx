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
  contentBackgroundColor = colors.accentSoft,
  edges = ["top"],
  style,
}: ScreenContainerProps) {
  return (
    <View style={[styles.root, { backgroundColor: contentBackgroundColor }]}>
      <SafeAreaView
        edges={edges}
        style={[
          styles.content,
          { backgroundColor: contentBackgroundColor },
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
