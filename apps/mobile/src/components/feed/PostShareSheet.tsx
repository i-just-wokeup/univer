import { useCallback, useState } from "react";

import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../common/Icon";
import { BottomSheet } from "../common/BottomSheet";
import type { PostShareTarget } from "../../features/chat/usePostShare";
import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
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

  // 의도: 푸터는 시트 밖 바닥에 고정하되, 열고 닫는 타이밍은 시트와 맞춘다.
  // backdropOpacity 는 열릴 때 0→1, 닫힐 때 1→0 이고 끌기와 무관해서,
  // 이 값으로 푸터를 같이 올리고 내리면 따로 노는 느낌이 사라진다.
  // 240 은 어떤 푸터 높이보다 커서 닫힐 때 화면 밖으로 완전히 빠진다.
  const footerTranslateY = backdropOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [240, 0],
  });

  return (
    <BottomSheet
      // 의도: 55%/92% 스냅과 배경 애니메이션은 공유 전용 훅이 소유한다.
      animationType="none"
      onClose={closeWithAnimation}
      visible={isOpen}
      backdropLabel="공유 닫기"
      backdropStyle={[styles.backdrop, { opacity: backdropOpacity }]}
      safeAreaBottom={false}
      sheetStyle={[
        styles.sheet,
        { height: fullSnapHeight, transform: [{ translateY }] },
      ]}
      overlayContent={externalShareUrl ? (
        <Animated.View
          onLayout={handleFooterLayout}
          style={[
            styles.fixedFooter,
            {
              opacity: backdropOpacity,
              transform: [{ translateY: footerTranslateY }],
            },
          ]}
        >
          <ExternalShareSection
            insetsBottom={insets.bottom}
            url={externalShareUrl}
          />
        </Animated.View>
      ) : null}
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
                <Icon name="book" size="md" stroke="thin" tone="text" />
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
    </BottomSheet>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  backdrop: {
    backgroundColor: c.scrimWeak,
  },
  sheet: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheetContent: {
    flex: 1,
  },
  // 의도: 시트 "밖" 화면 바닥에 고정한다(2026-08-03 결정).
  // 시트 안에 넣으면 반열림(55%) 상태에서 외부 공유가 화면 밖으로 밀려 안 보인다.
  // 링크 공유는 항상 보여야 해서 분리한 것이다. 2026-09-14 에 시트 안으로
  // 옮겨봤다가 같은 이유로 되돌렸다. 다시 옮기지 말 것.
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
