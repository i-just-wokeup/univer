import {
  Pressable,
  StyleSheet,
  Text,
} from "react-native";
import { BottomSheet } from "./BottomSheet";

import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
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
  const styles = useThemedStyles(makeStyles);

  return (
    <BottomSheet
      animationType="fade"
      onClose={onClose}
      visible={isOpen}
      backdropLabel="액션 시트 닫기"
      sheetStyle={styles.sheet}
    >
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
    </BottomSheet>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  sheet: {
    overflow: "hidden",
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
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
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
