import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react-native";

import { colors } from "../../lib/theme";

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
        <View style={styles.iconBox}>
          <Heart
            color={isLiked ? colors.danger : colors.white}
            fill={isLiked ? colors.danger : "transparent"}
            size={28}
            strokeWidth={1.8}
          />
        </View>
        <Text style={styles.actionText}>{formatCount(likesCount)}</Text>
      </Pressable>
      <Pressable hitSlop={6} onPress={onComment} style={styles.actionButton}>
        <View style={styles.iconBox}>
          <MessageCircle color={colors.white} size={28} strokeWidth={1.8} />
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
          <Send color={colors.white} size={28} strokeWidth={1.8} />
        </View>
      </Pressable>
      <Pressable hitSlop={6} onPress={onBookmark} style={styles.actionButton}>
        <View style={styles.iconBox}>
          <Bookmark
            color={colors.white}
            fill={isBookmarked ? colors.white : "transparent"}
            size={28}
            strokeWidth={1.8}
          />
        </View>
      </Pressable>
      {isReady ? (
        <Pressable hitSlop={6} onPress={onToggleMute} style={styles.actionButton}>
          <View style={styles.iconBox}>
            {isMuted ? (
              <VolumeX color={colors.white} size={28} strokeWidth={1.8} />
            ) : (
              <Volume2 color={colors.white} size={28} strokeWidth={1.8} />
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
    fontSize: 13,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 3,
  },
});
