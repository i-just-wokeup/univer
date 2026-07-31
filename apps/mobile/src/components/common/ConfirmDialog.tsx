import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../lib/theme";

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  danger?: boolean;
  description?: string;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
};

// 삭제/탈퇴/discard 등 확인이 필요한 모든 곳에서 재사용하는 공용 확인 다이얼로그.
export function ConfirmDialog({
  cancelLabel = "취소",
  confirmLabel = "확인",
  danger = false,
  description,
  isOpen,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={isOpen}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="닫기"
          accessibilityRole="button"
          onPress={onCancel}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                danger ? styles.dangerButton : styles.confirmButton,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text
                style={danger ? styles.dangerText : styles.confirmText}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.scrimMed,
    paddingHorizontal: 32,
  },
  dialog: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: colors.white,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  description: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    textAlign: "center",
  },
  actions: {
    marginTop: 22,
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  cancelText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "800",
  },
  confirmButton: {
    backgroundColor: colors.accent,
  },
  confirmText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  dangerText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.8,
  },
});
