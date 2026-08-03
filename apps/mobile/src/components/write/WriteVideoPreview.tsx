import { X } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { StoryVideoView } from "../stories/StoryVideoView";

type WriteVideoPreviewProps = {
  disabled: boolean;
  onRemove: () => void;
  uri: string;
};

export function WriteVideoPreview({
  disabled,
  onRemove,
  uri,
}: WriteVideoPreviewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.videoUploader}>
      <View style={styles.mediaHeader}>
        <Text style={styles.mediaTitle}>영상</Text>
        <Text style={styles.mediaCount}>1/1</Text>
      </View>
      <View style={styles.videoPreviewWrap}>
        <StoryVideoView
          isActive={!disabled}
          key={uri}
          loop
          style={styles.videoPreview}
          uri={uri}
        />
        <Pressable
          accessibilityLabel="영상 삭제"
          accessibilityRole="button"
          disabled={disabled}
          onPress={onRemove}
          style={({ pressed }) => [
            styles.removeVideoButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <X color={colors.white} size={18} strokeWidth={3} />
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  videoUploader: {
    gap: 12,
  },
  mediaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mediaTitle: {
    color: c.text,
    fontSize: 15,
    fontWeight: "900",
  },
  mediaCount: {
    color: c.textFaint,
    fontSize: 13,
    fontWeight: "800",
  },
  videoPreviewWrap: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: c.black,
  },
  videoPreview: {
    width: "100%",
    borderRadius: 20,
  },
  removeVideoButton: {
    position: "absolute",
    top: 10,
    right: 10,
    height: 34,
    width: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: c.mediaControlBg,
  },
  pressed: {
    opacity: 0.72,
  },
});
