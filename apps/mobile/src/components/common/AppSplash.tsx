import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, useWindowDimensions } from "react-native";

import { useTheme } from "../../lib/theme";
import { Logo } from "./Logo";

// 워드마크 원본 가로세로비(Logo와 동일). 화면 폭 기준으로 높이를 역산한다.
const ASPECT_RATIO = 2248.4 / 994;
const LOGO_WIDTH_RATIO = 0.52;
const MAX_LOGO_WIDTH = 280;
const MIN_VISIBLE_MS = 900;
const FADE_MS = 320;

type AppSplashProps = {
  onDone?: () => void;
};

// 네이티브 스플래시(배경색)에서 이어지는 JS 스플래시.
// 워드마크를 화면 폭 기준으로 그려 어떤 기기 크기에서도 가운데 반응형으로 표시하고
// 잠깐 뒤 서서히 사라진다. (안드로이드 12+ 원형 아이콘 제약을 우회)
export function AppSplash({ onDone }: AppSplashProps) {
  const { scheme } = useTheme();
  const { width } = useWindowDimensions();
  const opacity = useRef(new Animated.Value(1)).current;
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setHidden(true);
          onDone?.();
        }
      });
    }, MIN_VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [onDone, opacity]);

  if (hidden) {
    return null;
  }

  const backgroundColor = scheme === "dark" ? "#000000" : "#FFFFFF";
  const logoWidth = Math.min(width * LOGO_WIDTH_RATIO, MAX_LOGO_WIDTH);
  const logoHeight = logoWidth / ASPECT_RATIO;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        { backgroundColor, opacity },
      ]}
    >
      <Logo height={logoHeight} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
});
