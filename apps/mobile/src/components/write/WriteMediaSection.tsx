import { Film } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { PostAspectRatio } from "../../features/feed/types";
import { MAX_IMAGES } from "../../features/feed/useWriteForm";
import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { PostImageUploader } from "./PostImageUploader";
import { WriteVideoPreview } from "./WriteVideoPreview";

type SelectedVideo = {
  durationSeconds: number | null;
  uri: string;
};

type WriteMediaSectionProps = {
  aspectRatio: PostAspectRatio;
  imageUris: string[];
  isSubmitting: boolean;
  onPickImages: () => void;
  onPickVideo: () => void;
  onRemoveImage: (index: number) => void;
  onRemoveVideo: () => void;
  selectedVideo: SelectedVideo | null;
};

export function WriteMediaSection({
  aspectRatio,
  imageUris,
  isSubmitting,
  onPickImages,
  onPickVideo,
  onRemoveImage,
  onRemoveVideo,
  selectedVideo,
}: WriteMediaSectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (selectedVideo) {
    return (
      <View style={styles.card}>
        <WriteVideoPreview
          disabled={isSubmitting}
          onRemove={onRemoveVideo}
          uri={selectedVideo.uri}
        />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <PostImageUploader
        aspectRatio={aspectRatio}
        imageUris={imageUris}
        maxCount={MAX_IMAGES}
        onAdd={onPickImages}
        onRemove={onRemoveImage}
      />
      {imageUris.length === 0 ? (
        <Pressable
          accessibilityLabel="영상 선택"
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={onPickVideo}
          style={({ pressed }) => [
            styles.videoPickButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Film color={colors.accent} size={20} strokeWidth={2.5} />
          <Text style={styles.videoPickText}>영상 선택</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    borderRadius: 22,
    backgroundColor: c.card,
    padding: 16,
  },
  videoPickButton: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: c.navBackground,
  },
  videoPickText: {
    color: c.accent,
    fontSize: 14,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.72,
  },
});
