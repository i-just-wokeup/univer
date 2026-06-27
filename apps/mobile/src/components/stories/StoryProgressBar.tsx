import { StyleSheet, View } from "react-native";

import { colors } from "../../lib/theme";

type StoryProgressBarProps = {
  count: number;
  currentIndex: number;
  progress: number; // 현재 스토리 진행률 0~100
};

// 스토리 상단 진행바. 스토리 개수만큼 칸을 그리고 현재 칸만 progress%로 채운다.
export function StoryProgressBar({
  count,
  currentIndex,
  progress,
}: StoryProgressBarProps) {
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width:
                  index < currentIndex
                    ? "100%"
                    : index === currentIndex
                      ? `${progress}%`
                      : "0%",
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: "row",
    gap: 4,
    paddingTop: 8,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.34)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.white,
  },
});
