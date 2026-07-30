import { useId } from "react";
import { Globe } from "lucide-react-native";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

import type { SocialPlatform } from "../../lib/utils/profileLinks";
import { colors } from "../../lib/theme";

const BRAND_PATHS: Record<Exclude<SocialPlatform, "generic">, string> = {
  instagram: "", // TODO: simple-icons 원본 path 붙여넣기
  youtube: "", // TODO: simple-icons 원본 path 붙여넣기
  tiktok: "", // TODO: simple-icons 원본 path 붙여넣기
};

type SocialIconProps = {
  platform: SocialPlatform;
  size?: number;
};

function getStableSvgId(prefix: string, id: string) {
  return `${prefix}-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

export function SocialIcon({ platform, size = 22 }: SocialIconProps) {
  const reactId = useId();

  if (platform === "generic") {
    return <Globe color={colors.muted} size={size} strokeWidth={2.3} />;
  }

  const path = BRAND_PATHS[platform];
  const isInstagram = platform === "instagram";
  const fill = isInstagram
    ? `url(#${getStableSvgId("instagram-gradient", reactId)})`
    : platform === "youtube"
      ? "#FF0000"
      : colors.text;

  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      {isInstagram ? (
        <Defs>
          <LinearGradient
            id={getStableSvgId("instagram-gradient", reactId)}
            x1="2"
            x2="22"
            y1="22"
            y2="2"
          >
            <Stop offset="0" stopColor="#FEDA75" />
            <Stop offset="0.5" stopColor="#D62976" />
            <Stop offset="1" stopColor={colors.accent} />
          </LinearGradient>
        </Defs>
      ) : null}
      {path ? <Path d={path} fill={fill} /> : null}
    </Svg>
  );
}
