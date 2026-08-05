import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "../common/Avatar";
import { AccountBadge } from "../common/AccountBadge";
import type { ConversationWithUser } from "../../features/chat/api";
import { getRelativeTimeLabel } from "../../lib/utils/time";
import { nicknameTextStyle, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { useVerifiedUsers } from "../../lib/verifiedUsers";

type ConversationRowProps = {
  conversation: ConversationWithUser;
  currentUserId: string;
  onPress: (conversationId: string) => void;
};

export function ConversationRow({
  conversation,
  currentUserId,
  onPress,
}: ConversationRowProps) {
  const { getBadge } = useVerifiedUsers();
  const styles = useThemedStyles(makeStyles);
  const otherBadge = getBadge(conversation.other_user.id);
  const isMine = conversation.last_message_sender_id === currentUserId;
  const preview = conversation.last_message_preview
    ? isMine
      ? `나: ${conversation.last_message_preview}`
      : conversation.last_message_preview
    : "아직 메시지가 없습니다.";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(conversation.id)}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <Avatar
        imageUrl={conversation.other_user.avatar_url}
        label={conversation.other_user.nickname}
        size={42}
      />
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <View style={styles.nicknameGroup}>
            <Text numberOfLines={1} style={styles.nickname}>
              {conversation.other_user.nickname}
            </Text>
            {otherBadge ? (
              <View style={styles.verifiedBadge}>
                <AccountBadge badge={otherBadge} variant="symbol" />
              </View>
            ) : null}
          </View>
          {conversation.status === "pending" ? (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>요청</Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} style={styles.preview}>
          {preview}
        </Text>
      </View>
      <View style={styles.meta}>
        {conversation.last_message_at ? (
          <Text style={styles.time}>
            {getRelativeTimeLabel(conversation.last_message_at)}
          </Text>
        ) : null}
        {conversation.unread_count > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pressed: {
    backgroundColor: c.accentSoft,
  },
  body: {
    minWidth: 0,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nickname: {
    ...nicknameTextStyle,
    minWidth: 0,
    color: c.text,
    fontSize: fontSize.body,
    flexShrink: 1,
  },
  nicknameGroup: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  pendingBadge: {
    borderRadius: 999,
    backgroundColor: c.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingText: {
    color: c.accent,
    fontSize: fontSize.footnote,
    fontWeight: fontWeight.heavy,
  },
  preview: {
    marginTop: 4,
    color: c.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
  },
  meta: {
    minWidth: 42,
    alignItems: "flex-end",
    gap: 8,
  },
  time: {
    color: c.textFaint,
    fontSize: fontSize.footnote,
    fontWeight: fontWeight.semibold,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: c.accent,
    paddingHorizontal: 6,
  },
  unreadText: {
    color: c.onAccent,
    fontSize: fontSize.footnote,
    fontWeight: fontWeight.heavy,
  },
});
