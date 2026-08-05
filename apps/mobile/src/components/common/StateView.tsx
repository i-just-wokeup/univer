import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type StateViewProps = {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  title: string;
  type?: "empty" | "error" | "loading";
};

export function StateView({
  actionLabel,
  message,
  onAction,
  title,
  type = "empty",
}: StateViewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.container}>
      {type === "loading" ? (
        <ActivityIndicator color={colors.accent} style={styles.indicator} />
      ) : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.button}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 56,
  },
  indicator: {
    marginBottom: 14,
  },
  title: {
    color: c.text,
    fontSize: fontSize.titleSmall,
    fontWeight: fontWeight.heavy,
    textAlign: "center",
  },
  message: {
    marginTop: 8,
    color: c.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    lineHeight: 19,
    textAlign: "center",
  },
  button: {
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: c.accent,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: {
    color: c.onAccent,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
  },
});
