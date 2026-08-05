import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { NotificationItem } from "../../features/notifications/types";
import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { getRelativeTimeLabel } from "../../lib/utils/time";
import { Avatar } from "../common/Avatar";

type NotificationRowProps = {
  notification: NotificationItem;
  onPress: (notification: NotificationItem) => void;
};

// 좋아요류 알림에서 "무엇을" 좋아하는지 목적어 문구.
const LIKE_OBJECT_PHRASE: Partial<Record<NotificationItem["type"], string>> = {
  post_like: "회원님의 게시물을",
  story_like: "회원님의 스토리를",
  comment_like: "회원님의 댓글을",
};

// "철수님, 영희님 외 3명이 회원님의 게시물을 좋아합니다" 형태의 집계 문구.
function getLikeText(notification: NotificationItem, objectPhrase: string) {
  const names = notification.actors.map((actor) => actor.nickname);
  const count = Math.max(notification.actorCount, names.length);
  const shownNames = names.slice(0, 2);

  let subject: string;
  if (shownNames.length === 0) {
    subject = "누군가님";
  } else if (count > shownNames.length) {
    subject = `${shownNames.map((name) => `${name}님`).join(", ")} 외 ${
      count - shownNames.length
    }명`;
  } else {
    subject = shownNames.map((name) => `${name}님`).join(", ");
  }

  return `${subject}이 ${objectPhrase} 좋아합니다`;
}

// 알림 타입별 문구. actor 닉네임이 없으면 "누군가"로 대체.
function getNotificationText(notification: NotificationItem) {
  const nickname = notification.actor?.nickname ?? "누군가";
  const likeObjectPhrase = LIKE_OBJECT_PHRASE[notification.type];

  if (likeObjectPhrase) {
    return getLikeText(notification, likeObjectPhrase);
  }

  switch (notification.type) {
    case "post_comment":
      return `${nickname}님이 회원님의 게시물에 댓글을 남겼습니다`;
    case "comment_reply":
      return `${nickname}님이 회원님의 댓글에 답글을 남겼습니다`;
    case "user_like":
      return `${nickname}님이 회원님을 좋아합니다`;
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
  const styles = useThemedStyles(makeStyles);

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

      {notification.actors.length > 1 ? (
        <View style={styles.avatarStack}>
          <View style={styles.avatarBack}>
            <Avatar
              imageUrl={notification.actors[1].avatar_url}
              label={notification.actors[1].nickname}
              size={28}
            />
          </View>
          <View style={styles.avatarFront}>
            <Avatar
              imageUrl={notification.actors[0].avatar_url}
              label={notification.actors[0].nickname}
              size={32}
            />
          </View>
        </View>
      ) : (
        <Avatar
          imageUrl={notification.actor?.avatar_url ?? null}
          label={notification.actor?.nickname ?? "알림"}
          size={44}
        />
      )}

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
          recyclingKey={notification.id}
          source={{ uri: notification.thumbnail_url }}
          style={styles.thumbnail}
        />
      ) : null}
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  unread: {
    backgroundColor: c.accentSoft,
  },
  pressed: {
    opacity: 0.7,
  },
  avatarStack: {
    width: 44,
    height: 44,
  },
  avatarBack: {
    position: "absolute",
    right: 0,
    bottom: 0,
  },
  avatarFront: {
    position: "absolute",
    left: 0,
    top: 0,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: c.feedCard,
  },
  dotWrap: {
    width: 8,
    alignItems: "center",
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: c.accent,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  text: {
    color: c.text,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
  },
  textUnread: {
    fontWeight: fontWeight.heavy,
  },
  time: {
    marginTop: 4,
    color: c.textFaint,
    fontSize: fontSize.label,
    fontWeight: fontWeight.semibold,
  },
  thumbnail: {
    height: 48,
    width: 48,
    borderRadius: 14,
    backgroundColor: c.imagePlaceholder,
  },
});
