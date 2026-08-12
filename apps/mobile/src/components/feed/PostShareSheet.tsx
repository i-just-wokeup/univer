import { useCallback, useState } from "react";
import { BookOpen } from "lucide-react-native";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { PostShareTarget } from "../../features/chat/usePostShare";
import { useTheme, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { SearchInput } from "../search/SearchInput";
import { ExternalShareSection } from "./ExternalShareSection";
import { ShareTargetList } from "./ShareTargetList";
import { usePostShareSheetDrag } from "./usePostShareSheetDrag";

type PostShareSheetProps = {
  errorMessage: string | null;
  externalShareUrl?: string | null;
  isLoading: boolean;
  isOpen: boolean;
  isSearching: boolean;
  onClose: () => void;
  onAddToStory?: () => void;
  onQueryChange: (query: string) => void;
  onSelectTarget: (target: PostShareTarget) => void;
  query: string;
  sendingTargetId: string | null;
  targets: PostShareTarget[];
};

export function PostShareSheet({
  errorMessage,
  externalShareUrl = null,
  isLoading,
  isOpen,
  isSearching,
  onClose,
  onAddToStory,
  onQueryChange,
  onSelectTarget,
  query,
  sendingTargetId,
  targets,
}: PostShareSheetProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [footerHeight, setFooterHeight] = useState(0);
  const {
    backdropOpacity,
    closeWithAnimation,
    fullSnapHeight,
    insets,
    panHandlers,
    translateY,
  } = usePostShareSheetDrag({ isOpen, onClose });
  const handleFooterLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);

    setFooterHeight((currentHeight) =>
      currentHeight === nextHeight ? currentHeight : nextHeight,
    );
  }, []);
  const listBottomPadding = externalShareUrl
    ? footerHeight + 16
    : insets.bottom + 16;

  return (
    <Modal
      animationType="none"
      onRequestClose={closeWithAnimation}
      transparent
      visible={isOpen}
    >
      <View style={styles.root}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        >
          <Pressable
            accessibilityLabel="공유 닫기"
            onPress={closeWithAnimation}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: fullSnapHeight,
              transform: [{ translateY }],
            },
          ]}
        >
          <SafeAreaView edges={["bottom"]} style={styles.sheetContent}>
            <View style={styles.dragArea} {...panHandlers}>
              <View style={styles.handle} />
            </View>
            <View style={styles.header} {...panHandlers}>
              <Text style={styles.title}>게시물 공유</Text>
            </View>

            {onAddToStory ? (
              <View style={styles.storyActionWrap}>
                <Pressable
                  accessibilityLabel="내 스토리에 추가"
                  accessibilityRole="button"
                  onPress={onAddToStory}
                  style={({ pressed }) => [
                    styles.storyAction,
                    pressed ? styles.storyActionPressed : null,
                  ]}
                >
                  <View style={styles.storyActionIcon}>
                    <BookOpen color={colors.text} size={20} />
                  </View>
                  <Text style={styles.storyActionText}>내 스토리에 추가</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.searchWrap}>
              <SearchInput
                autoFocus={false}
                onChange={onQueryChange}
                placeholder="닉네임으로 검색"
                value={query}
              />
            </View>

            {errorMessage ? (
              <Text style={styles.stateText}>{errorMessage}</Text>
            ) : isLoading || isSearching ? (
              <Text style={styles.stateText}>
                {isLoading ? "공유 대상을 불러오는 중입니다…" : "검색 중입니다…"}
              </Text>
            ) : targets.length === 0 ? (
              <Text style={styles.stateText}>
                {query.trim()
                  ? "검색 결과가 없습니다."
                  : "공유할 대화나 크루가 없습니다."}
              </Text>
            ) : (
              <ShareTargetList
                contentBottomPadding={listBottomPadding}
                onSelectTarget={onSelectTarget}
                sendingTargetId={sendingTargetId}
                targets={targets}
              />
            )}
          </SafeAreaView>
        </Animated.View>

        {externalShareUrl ? (
          <View onLayout={handleFooterLayout} style={styles.fixedFooter}>
            <ExternalShareSection
              insetsBottom={insets.bottom}
              url={externalShareUrl}
            />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: c.scrimWeak,
  },
  sheet: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: c.navBackground,
  },
  sheetContent: {
    flex: 1,
  },
  fixedFooter: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
    backgroundColor: c.navBackground,
  },
  dragArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 58,
    height: 5,
    borderRadius: 999,
    backgroundColor: c.lavenderTint,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    color: c.text,
    fontSize: fontSize.title,
    fontWeight: fontWeight.heavy,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  storyActionWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  storyAction: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 14,
    backgroundColor: c.overlayInkFaint,
    paddingHorizontal: 14,
  },
  storyActionPressed: {
    opacity: 0.72,
  },
  storyActionIcon: {
    height: 32,
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: c.overlayInk,
  },
  storyActionText: {
    color: c.text,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.bold,
  },
  stateText: {
    paddingHorizontal: 18,
    paddingVertical: 34,
    color: c.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    textAlign: "center",
  },
});
