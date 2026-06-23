import { Image } from "expo-image";
import { Plus, X } from "lucide-react-native";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "../../lib/theme";

type PostImageUploaderProps = {
  imageUris: string[];
  maxCount: number;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

export function PostImageUploader({
  imageUris,
  maxCount,
  onAdd,
  onRemove,
}: PostImageUploaderProps) {
  const canAdd = imageUris.length < maxCount;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>사진</Text>
        <Text style={styles.count}>
          {imageUris.length}/{maxCount}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {imageUris.map((uri, index) => (
          <View key={`${uri}-${index}`} style={styles.thumbnailWrap}>
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              source={{ uri }}
              style={styles.thumbnail}
            />
            <Pressable
              accessibilityLabel="사진 삭제"
              accessibilityRole="button"
              onPress={() => onRemove(index)}
              style={styles.removeButton}
            >
              <X color={colors.white} size={16} strokeWidth={3} />
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
            <Plus color={colors.accent} size={28} strokeWidth={2.8} />
            <Text style={styles.addText}>추가</Text>
          </Pressable>
        ) : null}
      </ScrollView>
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
  list: {
    gap: 10,
    paddingRight: 2,
  },
  thumbnailWrap: {
    position: "relative",
  },
  thumbnail: {
    height: 112,
    width: 112,
    borderRadius: 18,
    backgroundColor: "#E8E3F3",
  },
  removeButton: {
    position: "absolute",
    right: 8,
    top: 8,
    height: 28,
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(21,22,27,0.72)",
  },
  addButton: {
    height: 112,
    width: 112,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(124,58,237,0.18)",
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: colors.white,
  },
  addText: {
    marginTop: 6,
    color: colors.accent,
    fontSize: 13,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.72,
  },
});
