import { Film } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { PostAspectRatio } from "../../features/feed/types";
import { MAX_IMAGES } from "../../features/feed/useWriteForm";
import { colors } from "../../lib/theme";
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

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 22,
    backgroundColor: colors.card,
    padding: 16,
  },
  videoPickButton: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.22)",
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  videoPickText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.72,
  },
});
