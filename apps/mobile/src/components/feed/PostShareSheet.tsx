import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import type { PostShareTarget } from "../../features/chat/usePostShare";
import { colors } from "../../lib/theme";
import { SearchInput } from "../search/SearchInput";
import { UserInline } from "../common/UserInline";

const HALF_SNAP_RATIO = 0.55;
const FULL_SNAP_RATIO = 0.92;
const CLOSE_DISTANCE = 88;
const CLOSE_VELOCITY = 1;
const EXPAND_VELOCITY = -0.6;

type PostShareSheetProps = {
  errorMessage: string | null;
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

function getSourceLabel(source: PostShareTarget["source"]) {
  if (source === "conversation") {
    return "대화";
  }

  if (source === "crew") {
    return "크루";
  }

  return "검색";
}

export function PostShareSheet({
  errorMessage,
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
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const fullSnapHeight = Math.round(windowHeight * FULL_SNAP_RATIO);
  const halfSnapHeight = Math.round(windowHeight * HALF_SNAP_RATIO);
  const halfSnapOffset = fullSnapHeight - halfSnapHeight;
  const closedOffset = fullSnapHeight + insets.bottom + 24;
  const translateY = useRef(new Animated.Value(closedOffset)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const isClosingRef = useRef(false);
  const gestureStartYRef = useRef(closedOffset);

  const animateTo = useCallback(
    (toValue: number) => {
      Animated.spring(translateY, {
        damping: 25,
        mass: 0.75,
        stiffness: 280,
        toValue,
        useNativeDriver: true,
      }).start();
    },
    [translateY],
  );

  const closeWithAnimation = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    Animated.parallel([
      Animated.timing(translateY, {
        duration: 200,
        toValue: closedOffset,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        duration: 200,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isClosingRef.current = false;
      onClose();
    });
  }, [backdropOpacity, closedOffset, onClose, translateY]);

  const settleSheet = useCallback(
    (currentY: number, velocityY: number) => {
      if (
        currentY > halfSnapOffset + CLOSE_DISTANCE ||
        (velocityY > CLOSE_VELOCITY && currentY > halfSnapOffset)
      ) {
        closeWithAnimation();
        return;
      }

      if (currentY < halfSnapOffset * 0.55 || velocityY < EXPAND_VELOCITY) {
        animateTo(0);
        return;
      }

      animateTo(halfSnapOffset);
    },
    [animateTo, closeWithAnimation, halfSnapOffset],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Math.abs(gestureState.dy) > 4 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderGrant: () => {
          translateY.stopAnimation((value) => {
            gestureStartYRef.current = value;
          });
        },
        onPanResponderMove: (_event, gestureState) => {
          const nextValue = Math.min(
            closedOffset,
            Math.max(0, gestureStartYRef.current + gestureState.dy),
          );
          translateY.setValue(nextValue);
        },
        onPanResponderRelease: (_event, gestureState) => {
          const nextValue = Math.min(
            closedOffset,
            Math.max(0, gestureStartYRef.current + gestureState.dy),
          );
          settleSheet(nextValue, gestureState.vy);
        },
        onPanResponderTerminate: () => animateTo(halfSnapOffset),
        onPanResponderTerminationRequest: () => false,
      }),
    [animateTo, closedOffset, halfSnapOffset, settleSheet, translateY],
  );

  // 열릴 때마다 화면 밖에서 시작해 반쯤 열린 detent로 슬라이드-인 + 배경 딤 페이드-인.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    isClosingRef.current = false;
    gestureStartYRef.current = halfSnapOffset;
    translateY.setValue(closedOffset);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, {
        duration: 260,
        toValue: halfSnapOffset,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        duration: 260,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, closedOffset, halfSnapOffset, isOpen, translateY]);

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
            <View style={styles.dragArea} {...panResponder.panHandlers}>
              <View style={styles.handle} />
            </View>
            <View style={styles.header} {...panResponder.panHandlers}>
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
              <ScrollView
                contentContainerStyle={[
                  styles.targetList,
                  { paddingBottom: insets.bottom + 16 },
                ]}
                keyboardShouldPersistTaps="handled"
              >
                {targets.map((target) => {
                  const isSending = sendingTargetId === target.id;

                  return (
                    <View key={target.id} style={styles.targetRow}>
                      <UserInline
                        avatarSize={44}
                        imageUrl={target.avatar_url}
                        meta={target.department ?? getSourceLabel(target.source)}
                        nickname={target.nickname}
                        style={styles.targetUser}
                      />
                      <Pressable
                        accessibilityRole="button"
                        disabled={Boolean(sendingTargetId)}
                        onPress={() => onSelectTarget(target)}
                        style={({ pressed }) => [
                          styles.sendButton,
                          pressed && !sendingTargetId ? styles.pressed : null,
                          sendingTargetId ? styles.disabled : null,
                        ]}
                      >
                        <Text style={styles.sendText}>
                          {isSending ? "전송 중" : "보내기"}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            )}
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
    backgroundColor: "rgba(0,0,0,0.32)",
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
    backgroundColor: "#DDD6FE",
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
  targetList: {
    paddingHorizontal: 10,
  },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  targetUser: {
    flex: 1,
  },
  sendButton: {
    borderRadius: 999,
    backgroundColor: colors.accent,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  sendText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
});
