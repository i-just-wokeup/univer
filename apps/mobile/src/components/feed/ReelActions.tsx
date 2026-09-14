import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "../common/Icon";
import { colors, fontSize, fontWeight } from "../../lib/theme";

type ReelActionsProps = {
  bottom: number;
  commentsCount: number;
  isBookmarked: boolean;
  isLiked: boolean;
  isMuted: boolean;
  isReady: boolean;
  likesCount: number;
  onBookmark: () => void;
  onComment: () => void;
  onLike: () => void;
  onShare: () => void;
  onToggleMute: () => void;
};

function formatCount(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}천`;
  }
  return `${count}`;
}

export function ReelActions({
  bottom,
  commentsCount,
  isBookmarked,
  isLiked,
  isMuted,
  isReady,
  likesCount,
  onBookmark,
  onComment,
  onLike,
  onShare,
  onToggleMute,
}: ReelActionsProps) {
  return (
    <View style={[styles.actions, { bottom }]}>
      <Pressable hitSlop={6} onPress={onLike} style={styles.actionButton}>
        {/* 의도: 영상 위의 얇은 선을 유지한다. 기존 1.8은 2026-09-14 결정으로 thin(2)에 흡수했다. */}
        <View style={styles.iconBox}>
          <Icon
            name="heart"
            size="lg"
            stroke="hairline"
            tone={isLiked ? "danger" : "onMedia"}
            filled={isLiked}
          />
        </View>
        <Text style={styles.actionText}>{formatCount(likesCount)}</Text>
      </Pressable>
      <Pressable hitSlop={6} onPress={onComment} style={styles.actionButton}>
        <View style={styles.iconBox}>
          <Icon name="messageCircle" size="lg" stroke="hairline" tone="onMedia" />
        </View>
        <Text style={styles.actionText}>{formatCount(commentsCount)}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="공유"
        accessibilityRole="button"
        hitSlop={6}
        onPress={onShare}
        style={styles.actionButton}
      >
        <View style={styles.iconBox}>
          <Icon name="send" size="lg" stroke="hairline" tone="onMedia" />
        </View>
      </Pressable>
      <Pressable hitSlop={6} onPress={onBookmark} style={styles.actionButton}>
        <View style={styles.iconBox}>
          <Icon name="bookmark" size="lg" stroke="hairline" tone="onMedia" filled={isBookmarked} />
        </View>
      </Pressable>
      {isReady ? (
        <Pressable hitSlop={6} onPress={onToggleMute} style={styles.actionButton}>
          <View style={styles.iconBox}>
            {isMuted ? (
              <Icon name="volumeOff" size="lg" stroke="hairline" tone="onMedia" />
            ) : (
              <Icon name="volumeOn" size="lg" stroke="hairline" tone="onMedia" />
            )}
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    position: "absolute",
    right: 10,
    alignItems: "center",
    gap: 10,
    // 하단 그라데이션 패널보다 위에 그려 아이콘이 가려지지 않게.
    zIndex: 2,
  },
  actionButton: {
    alignItems: "center",
    gap: 3,
  },
  // 아이콘을 고정 높이 박스에 담아 크기가 달라도 세로 리듬을 맞춘다.
  iconBox: {
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    height: 14,
    lineHeight: 14,
    color: colors.white,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    textShadowColor: colors.scrimMed,
    textShadowRadius: 3,
  },
});
