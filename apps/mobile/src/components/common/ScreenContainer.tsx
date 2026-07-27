import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../lib/theme";

type SafeAreaEdge = "top" | "right" | "bottom" | "left";

type ScreenContainerProps = PropsWithChildren<{
  contentBackgroundColor?: string;
  edges?: SafeAreaEdge[];
  reserveBottomInset?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function ScreenContainer({
  children,
  contentBackgroundColor = colors.accentSoft,
  edges = ["top"],
  reserveBottomInset = true,
  style,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <SafeAreaView
        edges={edges}
        style={[
          styles.content,
          { backgroundColor: contentBackgroundColor },
          reserveBottomInset ? { marginBottom: insets.bottom } : null,
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
    backgroundColor: colors.navBackground,
  },
  content: {
    flex: 1,
  },
});
