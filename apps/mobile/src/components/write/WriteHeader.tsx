import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../lib/theme";

type WriteHeaderProps = {
  canSubmit: boolean;
  isSubmitting: boolean;
  isVideoPost: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

export function WriteHeader({
  canSubmit,
  isSubmitting,
  isVideoPost,
  onCancel,
  onSubmit,
}: WriteHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        disabled={isSubmitting}
        onPress={onCancel}
        style={({ pressed }) => [
          styles.headerButton,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.cancelText}>취소</Text>
      </Pressable>
      <Text style={styles.headerTitle}>새 게시물</Text>
      <Pressable
        accessibilityRole="button"
        disabled={!canSubmit}
        onPress={onSubmit}
        style={({ pressed }) => [
          styles.submitButton,
          !canSubmit ? styles.disabledButton : null,
          pressed && canSubmit ? styles.pressed : null,
        ]}
      >
        <Text style={styles.submitText}>
          {isSubmitting ? (isVideoPost ? "업로드 중" : "게시 중") : "게시"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerButton: {
    minWidth: 58,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "900",
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  submitButton: {
    minWidth: 58,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
  },
  disabledButton: {
    opacity: 0.4,
  },
  submitText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.72,
  },
});
