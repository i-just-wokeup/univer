import { MoreHorizontal } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { UserInline } from "../common/UserInline";
import { colors } from "../../lib/theme";
import { getRelativeTimeLabel } from "../../lib/utils/time";
import type { FeedPost } from "../../features/feed/types";

type FeedPostHeaderProps = {
  onMorePress: () => void;
  onUserPress: (nickname: string) => void;
  post: FeedPost;
};

export function FeedPostHeader({
  onMorePress,
  onUserPress,
  post,
}: FeedPostHeaderProps) {
  return (
    <View style={styles.header}>
      <UserInline
        avatarSize={34}
        imageUrl={post.user.avatar_url}
        meta={`${post.user.department} · ${getRelativeTimeLabel(post.created_at)}`}
        nickname={post.user.nickname}
        nicknameSize={14}
        onPress={onUserPress}
        style={styles.userInline}
      />
      <Pressable
        accessibilityLabel="게시물 더보기"
        accessibilityRole="button"
        onPress={onMorePress}
        style={({ pressed }) => [
          styles.iconButton,
          pressed ? styles.pressed : null,
        ]}
      >
        <MoreHorizontal color={colors.textFaint} size={22} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  userInline: {
    flex: 1,
  },
  iconButton: {
    minHeight: 40,
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  pressed: {
    opacity: 0.62,
  },
});
