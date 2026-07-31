import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { PostShareTarget } from "../../features/chat/usePostShare";
import { colors } from "../../lib/theme";
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
  onQueryChange,
  onSelectTarget,
  query,
  sendingTargetId,
  targets,
}: PostShareSheetProps) {
  const {
    backdropOpacity,
    closeWithAnimation,
    fullSnapHeight,
    insets,
    panHandlers,
    translateY,
  } = usePostShareSheetDrag({ isOpen, onClose });

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
                externalShareUrl={externalShareUrl}
                insetsBottom={insets.bottom}
                onSelectTarget={onSelectTarget}
                sendingTargetId={sendingTargetId}
                targets={targets}
              />
            )}

            {externalShareUrl ? (
              <ExternalShareSection
                insetsBottom={insets.bottom}
                url={externalShareUrl}
              />
            ) : null}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.scrimWeak,
  },
  sheet: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.white,
  },
  sheetContent: {
    flex: 1,
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
    backgroundColor: colors.lavenderTint,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  stateText: {
    paddingHorizontal: 18,
    paddingVertical: 34,
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
});
