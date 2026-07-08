import { X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type {
  ActivityStory,
  ActivityStoryViewer,
} from "../../features/activity/api";
import { colors } from "../../lib/theme";
import { ActivityStoryPreviewMedia } from "./ActivityStoryPreviewMedia";
import { ActivityStoryPreviewMeta } from "./ActivityStoryPreviewMeta";
import { ActivityStoryViewerList } from "./ActivityStoryViewerList";

type ActivityStoryPreviewSheetProps = {
  isLoadingViewers: boolean;
  onClose: () => void;
  story: ActivityStory | null;
  viewers: ActivityStoryViewer[];
};

const VIEWER_PANEL_HEIGHT = 360;

export function ActivityStoryPreviewSheet({
  isLoadingViewers,
  onClose,
  story,
  viewers,
}: ActivityStoryPreviewSheetProps) {
  const insets = useSafeAreaInsets();
  const [isViewerListOpen, setIsViewerListOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // 스토리가 바뀌거나 닫히면 목록 패널은 접힌 상태로 초기화
  useEffect(() => {
    setIsViewerListOpen(false);
  }, [story?.id]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isViewerListOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isViewerListOpen, slideAnim]);

  if (!story) {
    return null;
  }

  const likedViewers = viewers.filter((viewer) => viewer.isLiked);
  const panelTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [VIEWER_PANEL_HEIGHT, 0],
  });

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={[styles.overlay, { paddingTop: insets.top + 14 }]}>
        <Pressable
          accessibilityLabel="닫기"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.closeButton}
        >
          <X color={colors.white} size={22} strokeWidth={2.6} />
        </Pressable>
        <View style={styles.sheet}>
          <ActivityStoryPreviewMedia story={story} />
          <ActivityStoryPreviewMeta
            likedCount={likedViewers.length}
            onOpenViewers={() => setIsViewerListOpen(true)}
            story={story}
          />

          {isViewerListOpen ? (
            <Pressable
              accessibilityLabel="조회한 사람 닫기"
              onPress={() => setIsViewerListOpen(false)}
              style={styles.viewerBackdrop}
            />
          ) : null}

          <Animated.View
            pointerEvents={isViewerListOpen ? "auto" : "none"}
            style={[
              styles.viewerPanel,
              { transform: [{ translateY: panelTranslateY }] },
            ]}
          >
            <ActivityStoryViewerList
              isLoadingViewers={isLoadingViewers}
              onClose={() => setIsViewerListOpen(false)}
              story={story}
              viewers={viewers}
            />
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,10,12,0.86)",
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 16,
    zIndex: 2,
    height: 42,
    width: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "94%",
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#09090B",
  },
  viewerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  viewerPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: VIEWER_PANEL_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#121214",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
});
