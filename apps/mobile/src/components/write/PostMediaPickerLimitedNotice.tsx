import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  fontSize,
  fontWeight,
  radius,
  spacing,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type PostMediaPickerLimitedNoticeProps = {
  disabled?: boolean;
  mediaType?: "photo" | "video";
  onPressSelectMore: () => void;
};

export function PostMediaPickerLimitedNotice({
  disabled = false,
  mediaType = "photo",
  onPressSelectMore,
}: PostMediaPickerLimitedNoticeProps) {
  const styles = useThemedStyles(makeStyles);
  const mediaLabel = mediaType === "video" ? "영상" : "사진";
  const actionLabel = "권한 다시 선택";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {mediaLabel} 접근 범위가 제한되어 있습니다
      </Text>
      <Text style={styles.message}>
        허용한 {mediaLabel}만 표시됩니다.{"\n"}
        모든 {mediaLabel}을 허용하거나 항목을 추가할 수 있습니다.
      </Text>
      <Pressable
        accessibilityLabel={actionLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        hitSlop={spacing.sm}
        onPress={onPressSelectMore}
        style={({ pressed }) => [
          styles.button,
          pressed && !disabled ? styles.buttonPressed : null,
          disabled ? styles.buttonDisabled : null,
        ]}
      >
        <Text style={styles.buttonText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    alignItems: "center",
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.xxxl + spacing.xxl,
  },
  title: {
    color: c.text,
    fontSize: fontSize.titleSmall,
    fontWeight: fontWeight.heavy,
    textAlign: "center",
  },
  message: {
    color: c.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  button: {
    backgroundColor: c.accent,
    borderRadius: radius.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: c.onAccent,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
  },
});
