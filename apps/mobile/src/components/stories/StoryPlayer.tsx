import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Eye, Heart } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StoryHeader } from "./StoryHeader";
import { StoryProgressBar } from "./StoryProgressBar";
import { StoryVideoView } from "./StoryVideoView";
import { StoryViewersSheet } from "./StoryViewersSheet";
import { ActionSheet, type ActionSheetItem } from "../common/ActionSheet";
import { ConfirmDialog } from "../common/ConfirmDialog";
import type { StoryGroup } from "../../features/stories/types";
import { useStoryPlayer } from "../../features/stories/useStoryPlayer";
import { useStableInsets } from "../../lib/useStableInsets";
import { colors } from "../../lib/theme";
import { getRelativeTimeLabel } from "../../lib/utils/time";

type StoryPlayerProps = {
  initialGroupIndex: number;
  initialGroups: StoryGroup[];
  onClose: () => void;
};

// 스토리 재생기. 어떤 스토리 목록이든(라이브/보관함/하이라이트) 받아 재생한다.
// 데이터 로딩은 바깥에서 하고, 재생/이동/좋아요/삭제/신고 로직은 useStoryPlayer 훅이 담당.
export function StoryPlayer({
  initialGroupIndex,
  initialGroups,
  onClose,
}: StoryPlayerProps) {
  const insets = useStableInsets();
  const {
    cancelDelete,
    cancelReport,
    closeMenu,
    closeViewerSheet,
    confirmDelete,
    confirmReport,
    currentGroup,
    currentStory,
    goNext,
    goPrev,
    isActionOpen,
    isDeleteOpen,
    isLiked,
    isPaused,
    isPortrait,
    isReportOpen,
    isViewerSheetOpen,
    markPortrait,
    openMenu,
    openViewerSheet,
    progress,
    requestDelete,
    requestReport,
    setVideoProgress,
    storyIndex,
    toggleLike,
    togglePause,
    viewers,
  } = useStoryPlayer({ initialGroupIndex, initialGroups, onClose });

  if (!currentGroup || !currentStory) {
    return null;
  }

  const actionItems: ActionSheetItem[] = currentStory.isMine
    ? [{ danger: true, label: "삭제", onPress: requestDelete }]
    : [{ danger: true, label: "신고", onPress: requestReport }];

  return (
    <View style={styles.screen}>
      {currentStory.mediaType === "video" ? (
        <StoryVideoView
          isPaused={isPaused}
          key={currentStory.id}
          onEnd={goNext}
          onProgress={setVideoProgress}
          style={{ marginTop: insets.top + 6 }}
          uri={currentStory.image_url}
        />
      ) : (
        <View style={[styles.frame, { marginTop: insets.top + 6 }]}>
          <Image
            blurRadius={28}
            cachePolicy="memory-disk"
            contentFit="cover"
            source={{ uri: currentStory.image_url }}
            style={styles.frameBlur}
          />
          <Image
            cachePolicy="memory-disk"
            contentFit={isPortrait ? "cover" : "contain"}
            onLoad={(event) => {
              markPortrait(event.source.height > event.source.width);
            }}
            source={{ uri: currentStory.image_url }}
            style={styles.frameImage}
          />
        </View>
      )}

      <LinearGradient
        colors={["rgba(0,0,0,0.5)", "transparent"]}
        pointerEvents="none"
        style={styles.scrimTop}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.5)"]}
        pointerEvents="none"
        style={styles.scrimBottom}
      />

      <Pressable
        accessibilityLabel={isPaused ? "재생" : "일시정지"}
        onPress={togglePause}
        style={StyleSheet.absoluteFill}
      />
      <Pressable
        accessibilityLabel="이전 스토리"
        onPress={goPrev}
        style={[styles.tapZone, styles.tapLeft]}
      />
      <Pressable
        accessibilityLabel="다음 스토리"
        onPress={goNext}
        style={[styles.tapZone, styles.tapRight]}
      />

      <SafeAreaView edges={["top"]} style={styles.topLayer}>
        <StoryProgressBar
          count={currentGroup.stories.length}
          currentIndex={storyIndex}
          progress={progress}
        />

        <StoryHeader
          avatarUrl={currentGroup.user.avatar_url}
          isPaused={isPaused}
          nickname={currentGroup.user.nickname}
          onClose={onClose}
          onMenu={openMenu}
          timeLabel={getRelativeTimeLabel(currentStory.created_at)}
        />
      </SafeAreaView>

      <SafeAreaView edges={["bottom"]} style={styles.bottomLayer}>
        <View style={styles.footer}>
          {currentStory.isMine ? (
            <Pressable
              accessibilityLabel="조회자 보기"
              accessibilityRole="button"
              onPress={() => {
                void openViewerSheet();
              }}
              style={styles.viewersButton}
            >
              <Eye color={colors.white} size={18} strokeWidth={2.4} />
              <Text style={styles.viewersText}>
                {currentStory.views_count}명 봄
              </Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityLabel="스토리 좋아요"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => {
                void toggleLike();
              }}
              style={styles.likeButton}
            >
              <Heart
                color={isLiked ? colors.danger : colors.white}
                fill={isLiked ? colors.danger : "transparent"}
                size={30}
                strokeWidth={2.4}
              />
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      <ActionSheet
        isOpen={isActionOpen}
        items={actionItems}
        onClose={closeMenu}
      />

      <ConfirmDialog
        cancelLabel="취소"
        confirmLabel="삭제"
        danger
        description="삭제된 스토리는 복구되지 않습니다."
        isOpen={isDeleteOpen}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        title="스토리를 삭제할까요?"
      />

      <ConfirmDialog
        cancelLabel="취소"
        confirmLabel="신고"
        danger
        description="이 콘텐츠를 신고하시겠습니까?"
        isOpen={isReportOpen}
        onCancel={cancelReport}
        onConfirm={() => {
          void confirmReport();
        }}
        title="신고하시겠습니까?"
      />

      <StoryViewersSheet
        isOpen={isViewerSheetOpen}
        onClose={closeViewerSheet}
        viewers={viewers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.black,
  },
  frame: {
    width: "100%",
    aspectRatio: 9 / 16,
    maxHeight: "100%",
    overflow: "hidden",
    borderRadius: 6,
    backgroundColor: colors.black,
  },
  frameBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  frameImage: {
    ...StyleSheet.absoluteFillObject,
  },
  scrimTop: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: 150,
  },
  scrimBottom: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: 150,
  },
  tapZone: {
    position: "absolute",
    top: 96,
    bottom: 110,
    width: "30%",
  },
  tapLeft: {
    left: 0,
  },
  tapRight: {
    right: 0,
  },
  topLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    paddingHorizontal: 12,
  },
  bottomLayer: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  viewersButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.42)",
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  viewersText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  likeButton: {
    alignSelf: "flex-end",
  },
});
