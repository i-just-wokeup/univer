import { Image, StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse } from "react-native-svg";

import { colors } from "../../lib/theme";

type AvatarProps = {
  imageUrl?: string | null;
  label: string;
  size?: number;
};

export function Avatar({ imageUrl, label, size = 40 }: AvatarProps) {
  const frameStyle = { height: size, width: size, borderRadius: size / 2 };

  return (
    <View
      accessibilityLabel={`${label} 프로필 이미지`}
      accessibilityRole="image"
      style={[styles.avatar, frameStyle]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={[styles.image, frameStyle]} />
      ) : (
        <Svg
          accessibilityElementsHidden
          height="100%"
          importantForAccessibility="no-hide-descendants"
          viewBox="0 0 80 80"
          width="100%"
        >
          <Circle cx="40" cy="40" fill={colors.avatarGlyph} opacity="0.18" r="40" />
          <Circle cx="40" cy="31" fill={colors.avatarGlyph} r="13" />
          <Ellipse cx="40" cy="65" fill={colors.avatarGlyph} rx="25" ry="21" />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: colors.skeleton,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
});
