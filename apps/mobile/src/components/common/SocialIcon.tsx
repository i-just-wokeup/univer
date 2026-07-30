import { Globe } from "lucide-react-native";
import { Image, StyleSheet } from "react-native";

import { colors } from "../../lib/theme";
import type { SocialPlatform } from "../../lib/utils/profileLinks";

const INSTAGRAM_GLYPH = require("../../../assets/social/instagram_glyph.png");
const YOUTUBE_ICON = require("../../../assets/social/yt_icon_red.png");
const YOUTUBE_ICON_ASPECT_RATIO = 1255 / 1075;

type SocialIconProps = {
  platform: SocialPlatform;
  size?: number;
};

export function SocialIcon({ platform, size = 20 }: SocialIconProps) {
  if (platform === "instagram") {
    return (
      <Image
        resizeMode="contain"
        source={INSTAGRAM_GLYPH}
        style={[styles.image, { height: size, width: size }]}
      />
    );
  }

  if (platform === "youtube") {
    return (
      <Image
        resizeMode="contain"
        source={YOUTUBE_ICON}
        style={[
          styles.image,
          { height: size, width: size * YOUTUBE_ICON_ASPECT_RATIO },
        ]}
      />
    );
  }

  return <Globe color={colors.muted} size={size} strokeWidth={2.3} />;
}

const styles = StyleSheet.create({
  image: {
    flexShrink: 0,
  },
});
