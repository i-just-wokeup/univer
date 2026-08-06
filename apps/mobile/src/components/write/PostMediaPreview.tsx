import { ImageIcon, Scaling } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import type { PostMediaCropTransform } from "../../features/feed/postMediaCrop";
import type { PostAspectRatio } from "../../features/feed/types";
import type { PostLibraryPhoto } from "../../features/feed/postMediaLibrary";
import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { getAspectRatioValue } from "../../lib/utils/aspectRatio";
import { PostMediaCropSurface } from "./PostMediaCropSurface";

type PostMediaPreviewProps = {
  aspectRatio: PostAspectRatio;
  cropTransform: PostMediaCropTransform;
  onChangeCropTransform: (transform: PostMediaCropTransform) => void;
  onCycleAspectRatio: () => void;
  photo: PostLibraryPhoto | null;
};

export function PostMediaPreview({
  aspectRatio,
  cropTransform,
  onChangeCropTransform,
  onCycleAspectRatio,
  photo,
}: PostMediaPreviewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View
      style={[
        styles.frame,
        { aspectRatio: getAspectRatioValue(aspectRatio) },
      ]}
    >
      {photo ? (
        <PostMediaCropSurface
          cropTransform={cropTransform}
          onChangeCropTransform={onChangeCropTransform}
          photo={photo}
        />
      ) : (
        <View style={styles.empty}>
          <ImageIcon color={colors.textFaint} size={34} strokeWidth={1.8} />
        </View>
      )}

      <Pressable
        accessibilityLabel="게시물 사진 비율 변경"
        accessibilityRole="button"
        disabled={!photo}
        hitSlop={8}
        onPress={onCycleAspectRatio}
        style={({ pressed }) => [
          styles.ratioButton,
          !photo ? styles.ratioButtonDisabled : null,
          pressed ? styles.pressed : null,
        ]}
      >
        <Scaling color={colors.onMediaGlyph} size={21} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  frame: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: c.imagePlaceholder,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ratioButton: {
    position: "absolute",
    bottom: 12,
    left: 12,
    height: 38,
    width: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: c.mediaControlBg,
  },
  ratioButtonDisabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
});
