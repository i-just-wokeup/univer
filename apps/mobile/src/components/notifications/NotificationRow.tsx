import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { NotificationItem } from "../../features/notifications/types";
import { colors } from "../../lib/theme";
import { getRelativeTimeLabel } from "../../lib/utils/time";
import { Avatar } from "../common/Avatar";

type NotificationRowProps = {
  notification: NotificationItem;
  onPress: (notification: NotificationItem) => void;
};

// 알림 타입별 문구. actor 닉네임이 없으면 "누군가"로 대체.
function getNotificationText(notification: NotificationItem) {
  const nickname = notification.actor?.nickname ?? "누군가";

  switch (notification.type) {
    case "post_like":
      return `${nickname}님이 회원님의 게시물을 좋아합니다`;
    case "story_like":
      return `${nickname}님이 회원님의 스토리를 좋아합니다`;
    case "comment_like":
      return `${nickname}님이 회원님의 댓글을 좋아합니다`;
    case "post_comment":
      return `${nickname}님이 회원님의 게시물에 댓글을 남겼습니다`;
    case "friend_request":
      return `${nickname}님이 친구 신청을 보냈습니다`;
    case "friend_accepted":
      return `${nickname}님이 친구 신청을 수락했습니다`;
    case "report_received":
      return "새로운 신고가 접수됐습니다";
    default:
      return notification.message ?? "새 알림이 있습니다";
  }
}

// 순수 UI. 알림 한 행(안읽음 점/아바타/문구/시간/썸네일).
export function NotificationRow({ notification, onPress }: NotificationRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(notification)}
      style={({ pressed }) => [
        styles.row,
        notification.is_read ? null : styles.unread,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.dotWrap}>
        {notification.is_read ? null : <View style={styles.dot} />}
      </View>

      <Avatar
        imageUrl={notification.actor?.avatar_url ?? null}
        label={notification.actor?.nickname ?? "알림"}
        size={44}
      />

      <View style={styles.body}>
        <Text
          style={[
            styles.text,
            notification.is_read ? null : styles.textUnread,
          ]}
        >
          {getNotificationText(notification)}
        </Text>
        <Text style={styles.time}>
          {getRelativeTimeLabel(notification.created_at)}
        </Text>
      </View>

      {notification.thumbnail_url ? (
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          source={{ uri: notification.thumbnail_url }}
          style={styles.thumbnail}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  unread: {
    backgroundColor: colors.accentSoft,
  },
  pressed: {
    opacity: 0.7,
  },
  dotWrap: {
    width: 8,
    alignItems: "center",
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  text: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  textUnread: {
    fontWeight: "900",
  },
  time: {
    marginTop: 4,
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "700",
  },
  thumbnail: {
    height: 48,
    width: 48,
    borderRadius: 14,
    backgroundColor: colors.imagePlaceholder,
  },
});
