import { Pressable, StyleSheet, Text, View } from "react-native";
import { BottomSheet } from "./BottomSheet";

import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type ConfirmDialogProps = {
  canCancel?: boolean;
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
  canCancel = true,
  cancelLabel = "취소",
  confirmLabel = "확인",
  danger = false,
  description,
  isOpen,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <BottomSheet
      animationType="fade"
      onClose={canCancel ? onCancel : () => undefined}
      dismissOnBackdropPress={canCancel}
      visible={isOpen}
      sheetStyle={styles.dialog}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onConfirm}
          style={({ pressed }) => [
            styles.item,
            canCancel ? null : styles.lastItem,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={[styles.itemText, danger ? styles.dangerText : null]}>
            {confirmLabel}
          </Text>
        </Pressable>
        {canCancel ? (
          <Pressable
            accessibilityRole="button"
            onPress={onCancel}
            style={({ pressed }) => [
              styles.item,
              styles.lastItem,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.itemText}>{cancelLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </BottomSheet>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  // 의도: 더보기 시트(ActionSheet)와 같은 모양이어야 한다. 확인창은 거의 항상
  // ⋯ 시트 바로 다음에 뜨므로 가로 꽉 참 + 가운데 정렬 + 항목별 구분선으로 맞춘다.
  // 2026-09-14 에 화면 가운데에서 내려오면서 카드 모양이 남아 어색했다.
  dialog: {
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  title: {
    color: c.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.heavy,
    textAlign: "center",
  },
  description: {
    marginTop: 6,
    color: c.muted,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
    textAlign: "center",
  },
  actions: {},
  item: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
    paddingHorizontal: 20,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemText: {
    color: c.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  dangerText: {
    color: c.danger,
  },
  pressed: {
    backgroundColor: c.overlayInkFaint,
  },
});
