import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

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
  const styles = useThemedStyles(makeStyles);
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

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: c.scrimMed,
  },
  sheet: {
    overflow: "hidden",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: c.navBackground,
  },
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
    fontSize: 15,
    fontWeight: "800",
  },
  dangerText: {
    color: c.danger,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    backgroundColor: c.overlayInkFaint,
  },
});
