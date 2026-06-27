import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../lib/theme";

export type ActionSheetItem = {
  danger?: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
};

type ActionSheetProps = {
  isOpen: boolean;
  items: ActionSheetItem[];
  onClose: () => void;
};

export function ActionSheet({ isOpen, items, onClose }: ActionSheetProps) {
  const insets = useSafeAreaInsets();
  const sheetStyle: ViewStyle = {
    paddingBottom: Math.max(insets.bottom, 12),
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={isOpen}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="액션 시트 닫기"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.sheet, sheetStyle]}>
          {items.map((item, index) => (
            <Pressable
              accessibilityRole="button"
              disabled={item.disabled}
              key={`${item.label}-${index}`}
              onPress={() => {
                if (item.disabled) {
                  return;
                }

                item.onPress();
                onClose();
              }}
              style={({ pressed }) => [
                styles.item,
                index === items.length - 1 ? styles.lastItem : null,
                pressed && !item.disabled ? styles.pressed : null,
                item.disabled ? styles.disabled : null,
              ]}
            >
              <Text
                style={[
                  styles.itemText,
                  item.danger ? styles.dangerText : null,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    overflow: "hidden",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.white,
  },
  item: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  dangerText: {
    color: colors.danger,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    backgroundColor: "rgba(20,22,30,0.04)",
  },
});
