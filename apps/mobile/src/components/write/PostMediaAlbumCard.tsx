import { Image } from "expo-image";
import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { PostLibraryAlbumOption } from "../../features/feed/postMediaLibrary";
import {
  fontSize,
  fontWeight,
  useTheme,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type PostMediaAlbumCardProps = {
  album: PostLibraryAlbumOption;
  isSelected: boolean;
  onPress: (albumId: string | null) => void;
  width: number;
};

export function PostMediaAlbumCard({
  album,
  isSelected,
  onPress,
  width,
}: PostMediaAlbumCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      accessibilityLabel={`${album.title} 앨범, 사진 ${album.assetCount}장`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={() => onPress(album.id)}
      style={({ pressed }) => [
        styles.card,
        { width },
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={[styles.cover, { height: width }]}>
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={album.coverPhoto.id}
          source={{ uri: album.coverPhoto.uri }}
          style={styles.image}
          transition={80}
        />
        {isSelected ? (
          <View style={styles.selectedBadge}>
            <Check color={colors.onAccent} size={16} strokeWidth={2.8} />
          </View>
        ) : null}
      </View>
      <Text numberOfLines={1} style={styles.title}>
        {album.title}
      </Text>
      <Text style={styles.count}>{album.assetCount.toLocaleString()}</Text>
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    minWidth: 0,
  },
  cover: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 6,
    backgroundColor: c.imagePlaceholder,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  selectedBadge: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: c.accent,
  },
  title: {
    color: c.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    paddingTop: 8,
    textAlign: "center",
  },
  count: {
    color: c.muted,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.regular,
    paddingTop: 2,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.78,
  },
});
