import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fontSize, fontWeight, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type FeedbackToastProps = {
  bottom: number;
  message: string;
  onDismiss: () => void;
  type?: "error" | "success";
};

const DISPLAY_DURATION_MS = 2400;

export function FeedbackToast({
  bottom,
  message,
  onDismiss,
  type = "error",
}: FeedbackToastProps) {
  const styles = useThemedStyles(makeStyles);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = setTimeout(onDismiss, DISPLAY_DURATION_MS);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) {
    return null;
  }

  return (
    <View
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={[
        styles.toast,
        type === "success" ? styles.success : styles.error,
        { bottom },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  toast: {
    position: "absolute",
    right: 20,
    left: 20,
    zIndex: 20,
    elevation: 20,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  error: {
    backgroundColor: c.dangerSolid,
  },
  success: {
    backgroundColor: c.success,
  },
  text: {
    color: c.white,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    textAlign: "center",
  },
});
