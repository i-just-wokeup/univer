import { Image } from "expo-image";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { DEFAULT_STORY_BACKGROUND_COLOR } from "../../features/stories/backgroundColors";

type StoryMediaFrameProps = {
  backgroundColor?: string | null;
  imageUrl: string;
  style?: ViewStyle;
};

// 스토리 이미지를 보여주는 9:16 프레임 — 단색 배경 + 원본 contain 레터박스.
// 작성 미리보기와 뷰어가 같은 모양이 되도록 공용으로 쓴다(미리보기 = 실제 스토리).
export function StoryMediaFrame({
  backgroundColor = DEFAULT_STORY_BACKGROUND_COLOR,
  imageUrl,
  style,
}: StoryMediaFrameProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.frame,
        { backgroundColor: backgroundColor ?? DEFAULT_STORY_BACKGROUND_COLOR },
        style,
      ]}
    >
      <Image
        cachePolicy="memory-disk"
        contentFit="contain"
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
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
});
