import { Image } from "expo-image";
import { Plus, X } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { PostAspectRatio } from "../../features/feed/types";
import { colors } from "../../lib/theme";
import { getAspectRatioValue } from "../../lib/utils/aspectRatio";

type PostImageUploaderProps = {
  aspectRatio: PostAspectRatio;
  imageUris: string[];
  maxCount: number;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

export function PostImageUploader({
  aspectRatio,
  imageUris,
  maxCount,
  onAdd,
  onRemove,
}: PostImageUploaderProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const canAdd = imageUris.length < maxCount;
  const activeIndex =
    imageUris.length > 0 ? Math.min(selectedIndex, imageUris.length - 1) : 0;
  const previewUri = imageUris[activeIndex];

  function handleRemove(index: number) {
    onRemove(index);
    setSelectedIndex((current) => (index < current ? current - 1 : current));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>사진</Text>
        <Text style={styles.count}>
          {imageUris.length}/{maxCount}
        </Text>
      </View>

      {previewUri ? (
        <View
          style={[styles.preview, { aspectRatio: getAspectRatioValue(aspectRatio) }]}
        >
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            source={{ uri: previewUri }}
            style={styles.previewImage}
          />
          {imageUris.length > 1 ? (
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>
                {activeIndex + 1}/{imageUris.length}
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <Pressable
          accessibilityLabel="사진 선택"
          accessibilityRole="button"
          onPress={onAdd}
          style={({ pressed }) => [
            styles.emptyPreview,
            pressed ? styles.pressed : null,
          ]}
        >
          <View style={styles.emptyIcon}>
            <Plus color={colors.white} size={28} strokeWidth={2.8} />
          </View>
          <Text style={styles.emptyText}>사진 선택</Text>
        </Pressable>
      )}

      {imageUris.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.list}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {imageUris.map((uri, index) => (
            <View key={`${uri}-${index}`} style={styles.thumbnailWrap}>
              <Pressable
                accessibilityLabel={`${index + 1}번째 사진 미리보기`}
                accessibilityRole="button"
                onPress={() => setSelectedIndex(index)}
                style={[
                  styles.thumbnail,
                  index === activeIndex ? styles.thumbnailActive : null,
                ]}
              >
                <Image
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  source={{ uri }}
                  style={styles.thumbnailImage}
                />
              </Pressable>
              <Pressable
                accessibilityLabel="사진 삭제"
                accessibilityRole="button"
                onPress={() => handleRemove(index)}
                style={styles.removeButton}
              >
                <X color={colors.white} size={14} strokeWidth={3} />
              </Pressable>
            </View>
          ))}

          {canAdd ? (
            <Pressable
              accessibilityLabel="사진 추가"
              accessibilityRole="button"
              onPress={onAdd}
              style={({ pressed }) => [
                styles.addButton,
                pressed ? styles.pressed : null,
              ]}
            >
              <Plus color={colors.accent} size={26} strokeWidth={2.8} />
            </Pressable>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  count: {
    color: colors.textFaint,
    fontSize: 13,
    fontWeight: "800",
  },
  preview: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: colors.imagePlaceholder,
  },
  previewImage: {
    height: "100%",
    width: "100%",
  },
  previewBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    borderRadius: 999,
    backgroundColor: "rgba(21,22,27,0.72)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  previewBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
  },
  emptyPreview: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderColor: "rgba(124,58,237,0.22)",
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: colors.white,
  },
  emptyIcon: {
    height: 52,
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: colors.accent,
  },
  emptyText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  list: {
    gap: 10,
    paddingRight: 2,
  },
  thumbnailWrap: {
    position: "relative",
  },
  thumbnail: {
    height: 72,
    width: 72,
    overflow: "hidden",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.imagePlaceholder,
  },
  thumbnailActive: {
    borderColor: colors.accent,
  },
  thumbnailImage: {
    height: "100%",
    width: "100%",
  },
  removeButton: {
    position: "absolute",
    right: 4,
    top: 4,
    height: 24,
    width: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(21,22,27,0.72)",
  },
  addButton: {
    height: 72,
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(124,58,237,0.18)",
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: colors.white,
  },
  pressed: {
    opacity: 0.72,
  },
});
