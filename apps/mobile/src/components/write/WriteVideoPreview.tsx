import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "../common/Icon";
import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { StoryVideoView } from "../stories/StoryVideoView";

type WriteVideoPreviewProps = {
  disabled: boolean;
  onRemove: () => void;
  uri: string;
};

export function WriteVideoPreview({
  disabled,
  onRemove,
  uri,
}: WriteVideoPreviewProps) {

  const styles = useThemedStyles(makeStyles);
  const [unmutedUri, setUnmutedUri] = useState<string | null>(null);
  const isMuted = unmutedUri !== uri;

  return (
    <View style={styles.videoUploader}>
      <View style={styles.mediaHeader}>
        <Text style={styles.mediaTitle}>영상</Text>
        <Text style={styles.mediaCount}>1/1</Text>
      </View>
      <View style={styles.videoPreviewWrap}>
        <StoryVideoView
          isActive={!disabled}
          key={uri}
          loop
          muted={isMuted}
          style={styles.videoPreview}
          uri={uri}
        />
        <Pressable
          accessibilityLabel="영상 삭제"
          accessibilityRole="button"
          disabled={disabled}
          onPress={onRemove}
          style={({ pressed }) => [
            styles.removeVideoButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Icon name="x" size="sm" stroke="bold" tone="onMedia" />
        </Pressable>
        <Pressable
          accessibilityLabel={isMuted ? "영상 소리 켜기" : "영상 소리 끄기"}
          accessibilityRole="button"
          disabled={disabled}
          onPress={() =>
            setUnmutedUri((currentUri) =>
              currentUri === uri ? null : uri,
            )
          }
          style={({ pressed }) => [
            styles.soundButton,
            pressed ? styles.pressed : null,
          ]}
        >
          {isMuted ? (
            <Icon name="volumeOff" size="sm" stroke="regular" tone="onMedia" />
          ) : (
            <Icon name="volumeOn" size="sm" stroke="regular" tone="onMedia" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  videoUploader: {
    gap: 12,
  },
  mediaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mediaTitle: {
    color: c.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.heavy,
  },
  mediaCount: {
    color: c.textFaint,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
  },
  videoPreviewWrap: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: c.black,
  },
  videoPreview: {
    width: "100%",
    borderRadius: 20,
  },
  removeVideoButton: {
    position: "absolute",
    top: 10,
    right: 10,
    height: 34,
    width: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: c.mediaControlBg,
  },
  soundButton: {
    position: "absolute",
    right: 10,
    bottom: 10,
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: c.mediaControlBg,
  },
  pressed: {
    opacity: 0.72,
  },
});
