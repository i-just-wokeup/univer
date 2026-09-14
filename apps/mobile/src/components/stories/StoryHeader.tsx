import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "../common/Icon";
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
          <Icon name="pause" size="md" stroke="thin" tone="onMedia" filled />
        ) : null}
        <Pressable
          accessibilityLabel="스토리 메뉴"
          accessibilityRole="button"
          hitSlop={10}
          onPress={onMenu}
        >
          <Icon name="more" size="lg" stroke="regular" tone="onMedia" />
        </Pressable>
        <Pressable
          accessibilityLabel="닫기"
          accessibilityRole="button"
          hitSlop={10}
          onPress={onClose}
        >
          <Icon name="x" size="lg" stroke="regular" tone="onMedia" />
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
