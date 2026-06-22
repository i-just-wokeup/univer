import { Image, StyleSheet, Text, View } from "react-native";

import { colors } from "../../lib/theme";

type AvatarProps = {
  imageUrl?: string | null;
  label: string;
  size?: number;
};

export function Avatar({ imageUrl, label, size = 40 }: AvatarProps) {
  const initial = label.trim().slice(0, 1).toUpperCase() || "U";
  const frameStyle = { height: size, width: size, borderRadius: size / 2 };

  return (
    <View style={[styles.avatar, frameStyle]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={[styles.image, frameStyle]} />
      ) : (
        <Text style={styles.initial}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#DDD3FA",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  initial: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "900",
  },
});
