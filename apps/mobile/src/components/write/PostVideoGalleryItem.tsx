import { Film, Play } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { PostLibraryVideo } from "../../features/feed/postMediaLibrary";
import {
  fontSize,
  fontWeight,
  useTheme,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { PostLibraryAssetThumbnail } from "./PostLibraryAssetThumbnail";

type PostVideoGalleryItemProps = {
  disabled: boolean;
  isSelected: boolean;
  itemSize: number;
  onSelect: (video: PostLibraryVideo) => void;
  shouldLoadThumbnail: boolean;
  video: PostLibraryVideo;
};

function formatDuration(durationSeconds: number): string {
  const totalSeconds = Math.max(0, Math.round(durationSeconds));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function PostVideoGalleryItem({
  disabled,
  isSelected,
  itemSize,
  onSelect,
  shouldLoadThumbnail,
  video,
}: PostVideoGalleryItemProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      accessibilityLabel={`${formatDuration(video.durationSeconds)} 영상 선택`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      disabled={disabled}
      onPress={() => onSelect(video)}
      style={({ pressed }) => [
        styles.button,
        { height: itemSize, width: itemSize },
        pressed ? styles.pressed : null,
      ]}
    >
      <PostLibraryAssetThumbnail
        asset={video}
        enabled={shouldLoadThumbnail}
        style={styles.image}
      />
      <View pointerEvents="none" style={styles.playBadge}>
        <Play color={colors.onMediaGlyph} fill={colors.onMediaGlyph} size={13} />
      </View>
      <View pointerEvents="none" style={styles.durationBadge}>
        <Film color={colors.onMediaGlyph} size={12} strokeWidth={2.2} />
        <Text style={styles.durationText}>
          {formatDuration(video.durationSeconds)}
        </Text>
      </View>
      {isSelected ? <View pointerEvents="none" style={styles.selectedOutline} /> : null}
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
  playBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    height: 26,
    width: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: c.mediaControlBg,
  },
  durationBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    minHeight: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 11,
    backgroundColor: c.mediaControlBg,
    paddingHorizontal: 7,
  },
  durationText: {
    color: c.onMediaGlyph,
    fontSize: fontSize.footnote,
    fontWeight: fontWeight.semibold,
    fontVariant: ["tabular-nums"],
  },
  selectedOutline: {
    ...StyleSheet.absoluteFillObject,
    borderColor: c.accent,
    borderWidth: 3,
  },
  pressed: {
    opacity: 0.82,
  },
});
