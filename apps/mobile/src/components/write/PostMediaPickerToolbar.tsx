import { ChevronDown, Film, ImageIcon, Images } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { PostLibraryMediaType } from "../../features/feed/postMediaLibrary";
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
  mediaType: PostLibraryMediaType;
  onOpenAlbumPicker: () => void;
  onSwitchMediaType: () => void;
  onToggleMultiSelect: () => void;
};

export function PostMediaPickerToolbar({
  albumTitle,
  disabled,
  isMultiSelect,
  mediaType,
  onOpenAlbumPicker,
  onSwitchMediaType,
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
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={
            mediaType === "video" ? "사진 보관함 보기" : "영상 보관함 보기"
          }
          accessibilityRole="button"
          disabled={disabled}
          onPress={onSwitchMediaType}
          style={({ pressed }) => [
            styles.actionButton,
            pressed ? styles.pressed : null,
          ]}
        >
          {mediaType === "video" ? (
            <ImageIcon color={colors.text} size={18} strokeWidth={2.2} />
          ) : (
            <Film color={colors.text} size={18} strokeWidth={2.2} />
          )}
          <Text style={styles.actionText}>
            {mediaType === "video" ? "사진" : "영상"}
          </Text>
        </Pressable>
        {mediaType === "photo" ? (
          <Pressable
            accessibilityLabel={
              isMultiSelect ? "여러 사진 선택 끄기" : "여러 사진 선택"
            }
            accessibilityRole="button"
            disabled={disabled}
            onPress={onToggleMultiSelect}
            style={({ pressed }) => [
              styles.actionButton,
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
                styles.actionText,
                isMultiSelect ? styles.multiSelectTextActive : null,
              ]}
            >
              선택
            </Text>
          </Pressable>
        ) : null}
      </View>
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
    flex: 1,
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
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionButton: {
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
  actionText: {
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
