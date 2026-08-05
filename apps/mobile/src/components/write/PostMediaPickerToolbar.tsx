import { ChevronDown, Images } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  fontSize,
  fontWeight,
  useTheme,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

export const POST_MEDIA_PICKER_TOOLBAR_HEIGHT = 50;

type PostMediaPickerToolbarProps = {
  albumTitle: string;
  disabled: boolean;
  isMultiSelect: boolean;
  onOpenAlbumPicker: () => void;
  onToggleMultiSelect: () => void;
};

export function PostMediaPickerToolbar({
  albumTitle,
  disabled,
  isMultiSelect,
  onOpenAlbumPicker,
  onToggleMultiSelect,
}: PostMediaPickerToolbarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.toolbar}>
      <Pressable
        accessibilityLabel={`앨범 선택, 현재 ${albumTitle}`}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onOpenAlbumPicker}
        style={({ pressed }) => [
          styles.albumButton,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text numberOfLines={1} style={styles.title}>
          {albumTitle}
        </Text>
        <ChevronDown color={colors.text} size={18} strokeWidth={2.4} />
      </Pressable>
      <Pressable
        accessibilityLabel={
          isMultiSelect ? "여러 사진 선택 끄기" : "여러 사진 선택"
        }
        accessibilityRole="button"
        disabled={disabled}
        onPress={onToggleMultiSelect}
        style={({ pressed }) => [
          styles.multiSelectButton,
          isMultiSelect ? styles.multiSelectButtonActive : null,
          pressed ? styles.pressed : null,
        ]}
      >
        <Images
          color={isMultiSelect ? colors.onAccent : colors.text}
          size={18}
          strokeWidth={2.2}
        />
        <Text
          style={[
            styles.multiSelectText,
            isMultiSelect ? styles.multiSelectTextActive : null,
          ]}
        >
          선택
        </Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  toolbar: {
    height: POST_MEDIA_PICKER_TOOLBAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    backgroundColor: c.accentSoft,
  },
  albumButton: {
    minWidth: 0,
    maxWidth: "58%",
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  title: {
    flexShrink: 1,
    color: c.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.heavy,
  },
  multiSelectButton: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 17,
    backgroundColor: c.overlayInk,
    paddingHorizontal: 12,
  },
  multiSelectButtonActive: {
    backgroundColor: c.accent,
  },
  multiSelectText: {
    color: c.text,
    fontSize: fontSize.label,
    fontWeight: fontWeight.semibold,
  },
  multiSelectTextActive: {
    color: c.onAccent,
  },
  pressed: {
    opacity: 0.7,
  },
});
