import { MoreHorizontal, Pause, X } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "../common/Avatar";
import { colors, nicknameTextStyle, fontSize, fontWeight } from "../../lib/theme";

type StoryHeaderProps = {
  avatarUrl: string | null;
  isPaused: boolean;
  nickname: string;
  onClose: () => void;
  onMenu: () => void;
  timeLabel: string;
};

// 스토리 상단 작성자/시간 + 일시정지 표시 + 메뉴(⋯)/닫기(X).
export function StoryHeader({
  avatarUrl,
  isPaused,
  nickname,
  onClose,
  onMenu,
  timeLabel,
}: StoryHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.author}>
        <Avatar imageUrl={avatarUrl} label={nickname} size={36} />
        <Text style={styles.authorName}>{nickname}</Text>
        <Text style={styles.time}>{timeLabel}</Text>
      </View>
      <View style={styles.headerActions}>
        {isPaused ? (
          <Pause color={colors.white} fill={colors.white} size={20} />
        ) : null}
        <Pressable
          accessibilityLabel="스토리 메뉴"
          accessibilityRole="button"
          hitSlop={10}
          onPress={onMenu}
        >
          <MoreHorizontal color={colors.white} size={26} strokeWidth={2.6} />
        </Pressable>
        <Pressable
          accessibilityLabel="닫기"
          accessibilityRole="button"
          hitSlop={10}
          onPress={onClose}
        >
          <X color={colors.white} size={26} strokeWidth={2.6} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  author: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  authorName: {
    ...nicknameTextStyle,
    color: colors.white,
    fontSize: fontSize.bodySmall,
  },
  time: {
    color: colors.onMediaText,
    fontSize: fontSize.label,
    fontWeight: fontWeight.semibold,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
});
