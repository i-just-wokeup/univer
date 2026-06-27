import { Image } from "expo-image";
import { ChevronDown, Eye, Heart, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type {
  ActivityStory,
  ActivityStoryViewer,
} from "../../features/activity/api";
import { colors } from "../../lib/theme";
import { Avatar } from "../common/Avatar";
import { activityStoryDisplay } from "./ActivityStoryGrid";

type ActivityStoryPreviewSheetProps = {
  isLoadingViewers: boolean;
  onClose: () => void;
  story: ActivityStory | null;
  viewers: ActivityStoryViewer[];
};

const VIEWER_PANEL_HEIGHT = 360;

function formatKoreanDateTime(createdAt: string) {
  const date = new Date(createdAt);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatViewerTime(createdAt: string) {
  const date = new Date(createdAt);
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

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
          <View style={styles.preview}>
            <Image
              cachePolicy="memory-disk"
              contentFit="contain"
              source={{ uri: story.image_url }}
              style={styles.previewImage}
            />
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>
                {formatKoreanDateTime(story.created_at)}
              </Text>
            </View>
          </View>

          <View style={styles.meta}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsViewerListOpen(true)}
              style={({ pressed }) => [
                styles.metaButton,
                pressed ? styles.metaButtonPressed : null,
              ]}
            >
              <Eye color={colors.white} size={15} strokeWidth={2.4} />
              <Text style={styles.metaText}>조회 {story.views_count}</Text>
            </Pressable>
            <View style={styles.metaItem}>
              <Heart color={colors.white} size={15} strokeWidth={2.4} />
              <Text style={styles.metaText}>좋아요 {likedViewers.length}</Text>
            </View>
            <Text style={styles.metaText}>
              {activityStoryDisplay.getVisibilityLabel(story.visibility)}
            </Text>
            <Text style={styles.metaText}>
              {activityStoryDisplay.getStoryStatus(story)}
            </Text>
          </View>

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
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsViewerListOpen(false)}
              style={styles.viewerHeader}
            >
              <View>
                <Text style={styles.viewerTitle}>조회한 사람</Text>
                <Text style={styles.viewerTime}>
                  {formatKoreanDateTime(story.created_at)}
                </Text>
              </View>
              <ChevronDown color={colors.white} size={22} strokeWidth={2.6} />
            </Pressable>
            <ScrollView style={styles.viewerList}>
              {isLoadingViewers ? (
                <Text style={styles.viewerEmpty}>
                  조회자 정보를 불러오는 중입니다.
                </Text>
              ) : viewers.length > 0 ? (
                viewers.map((viewer) => (
                  <View key={viewer.id} style={styles.viewerRow}>
                    <Avatar
                      imageUrl={viewer.avatar_url}
                      label={viewer.nickname}
                      size={38}
                    />
                    <View style={styles.viewerBody}>
                      <Text numberOfLines={1} style={styles.viewerName}>
                        {viewer.nickname}
                      </Text>
                      <Text style={styles.viewerSub}>
                        {formatViewerTime(viewer.viewed_at)}
                      </Text>
                    </View>
                    {viewer.isLiked ? (
                      <View style={styles.likeBadge}>
                        <Heart
                          color={colors.danger}
                          fill={colors.danger}
                          size={13}
                        />
                        <Text style={styles.likeText}>좋아요</Text>
                      </View>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={styles.viewerEmpty}>
                  아직 조회한 사람이 없습니다.
                </Text>
              )}
            </ScrollView>
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
  preview: {
    width: "100%",
    aspectRatio: 9 / 16,
    backgroundColor: colors.black,
  },
  previewImage: {
    height: "100%",
    width: "100%",
  },
  dateBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  dateText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaButtonPressed: {
    opacity: 0.7,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "800",
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
  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  viewerTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },
  viewerTime: {
    marginTop: 2,
    color: "rgba(255,255,255,0.38)",
    fontSize: 12,
    fontWeight: "700",
  },
  viewerList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  viewerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  viewerBody: {
    minWidth: 0,
    flex: 1,
  },
  viewerName: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  viewerSub: {
    marginTop: 2,
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "700",
  },
  likeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,59,78,0.14)",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  likeText: {
    color: "#FECACA",
    fontSize: 11,
    fontWeight: "900",
  },
  viewerEmpty: {
    paddingVertical: 24,
    color: "rgba(255,255,255,0.42)",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
});
