import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { colors } from "../../lib/theme";

type StoryMediaFrameProps = {
  imageUrl: string;
  style?: ViewStyle;
};

// 스토리 미디어를 보여주는 9:16 프레임 — 흐린 배경(블러) + 원본 레터박스(세로면 cover, 그 외 contain).
// 작성 미리보기와 뷰어가 같은 모양이 되도록 공용으로 쓴다(미리보기 = 실제 스토리).
export function StoryMediaFrame({ imageUrl, style }: StoryMediaFrameProps) {
  const [isPortrait, setIsPortrait] = useState(false);

  return (
    <View style={[styles.frame, style]}>
      <Image
        blurRadius={28}
        cachePolicy="memory-disk"
        contentFit="cover"
        source={{ uri: imageUrl }}
        style={styles.fill}
      />
      <Image
        cachePolicy="memory-disk"
        contentFit={isPortrait ? "cover" : "contain"}
        onLoad={(event) => {
          setIsPortrait(event.source.height > event.source.width);
        }}
        source={{ uri: imageUrl }}
        style={styles.fill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    aspectRatio: 9 / 16,
    maxHeight: "100%",
    overflow: "hidden",
    borderRadius: 6,
    backgroundColor: colors.black,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
});
