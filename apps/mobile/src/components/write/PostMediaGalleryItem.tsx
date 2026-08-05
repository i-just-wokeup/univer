import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { PostLibraryPhoto } from "../../features/feed/postMediaLibrary";
import {
  fontSize,
  fontWeight,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type PostMediaGalleryItemProps = {
  disabled: boolean;
  itemSize: number;
  onSelect: (photo: PostLibraryPhoto) => void;
  photo: PostLibraryPhoto;
  selectionIndex?: number;
};

export function PostMediaGalleryItem({
  disabled,
  itemSize,
  onSelect,
  photo,
  selectionIndex,
}: PostMediaGalleryItemProps) {
  const styles = useThemedStyles(makeStyles);
  const isSelected = selectionIndex !== undefined;

  return (
    <Pressable
      accessibilityLabel={
        selectionIndex
          ? `${selectionIndex}번째로 선택된 사진`
          : "사진 선택"
      }
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => onSelect(photo)}
      style={({ pressed }) => [
        styles.button,
        { height: itemSize, width: itemSize },
        pressed ? styles.pressed : null,
      ]}
    >
      <Image
        cachePolicy="memory-disk"
        contentFit="cover"
        recyclingKey={photo.id}
        source={{ uri: photo.uri }}
        style={styles.image}
        transition={80}
      />
      {isSelected ? <View style={styles.selectedOutline} /> : null}
      {selectionIndex ? (
        <View style={styles.selectionBadge}>
          <Text style={styles.selectionBadgeText}>{selectionIndex}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  button: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: c.imagePlaceholder,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  selectedOutline: {
    ...StyleSheet.absoluteFillObject,
    borderColor: c.accent,
    borderWidth: 3,
  },
  selectionBadge: {
    position: "absolute",
    right: 8,
    top: 8,
    height: 26,
    minWidth: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: c.accent,
    paddingHorizontal: 5,
  },
  selectionBadgeText: {
    color: c.onAccent,
    fontSize: fontSize.label,
    fontWeight: fontWeight.heavy,
    fontVariant: ["tabular-nums"],
  },
  pressed: {
    opacity: 0.82,
  },
});
