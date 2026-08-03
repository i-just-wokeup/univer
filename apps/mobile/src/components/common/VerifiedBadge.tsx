import Svg, { Circle, Path } from "react-native-svg";

type VerifiedBadgeProps = {
  size?: number;
};

export function VerifiedBadge({ size = 14 }: VerifiedBadgeProps) {
  return (
    <Svg
      accessibilityLabel="인증됨"
      accessibilityRole="image"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <Circle cx={12} cy={12} fill="#3897F0" r={12} />
      <Path
        d="M10.2 16.6a1 1 0 0 1-.71-.29l-3.1-3.1a1 1 0 1 1 1.42-1.42l2.39 2.39 5.99-5.99a1 1 0 0 1 1.42 1.42l-6.7 6.7a1 1 0 0 1-.71.29Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}
