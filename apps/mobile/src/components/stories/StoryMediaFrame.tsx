import { Image, type ImageContentFit } from "expo-image";
import { useEffect, useState } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { DEFAULT_STORY_BACKGROUND_COLOR } from "../../features/stories/backgroundColors";

const STORY_FRAME_ASPECT_RATIO = 9 / 16;

type StoryMediaFrameProps = {
  backgroundColor?: string | null;
  imageUrl: string;
  style?: ViewStyle;
};

function getStoryImageContentFit(width: number, height: number): ImageContentFit {
  return width / height < STORY_FRAME_ASPECT_RATIO ? "cover" : "contain";
}

// 스토리 이미지를 보여주는 9:16 프레임 — 좌우를 채우고, 짧은 사진만 단색 레터박스로 둔다.
// 작성 미리보기와 뷰어가 같은 모양이 되도록 공용으로 쓴다(미리보기 = 실제 스토리).
export function StoryMediaFrame({
  backgroundColor = DEFAULT_STORY_BACKGROUND_COLOR,
  imageUrl,
  style,
}: StoryMediaFrameProps) {
  const [contentFit, setContentFit] = useState<ImageContentFit>("cover");

  useEffect(() => {
    setContentFit("cover");
  }, [imageUrl]);

  return (
    <View
      style={[
        styles.frame,
        { backgroundColor: backgroundColor ?? DEFAULT_STORY_BACKGROUND_COLOR },
        style,
      ]}
    >
      <Image
        cachePolicy="memory-disk"
        contentFit={contentFit}
        onLoad={(event) => {
          const width = event.source?.width;
          const height = event.source?.height;
          if (width > 0 && height > 0) {
            setContentFit(getStoryImageContentFit(width, height));
          }
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
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
});
