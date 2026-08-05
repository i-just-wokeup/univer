import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "../common/Avatar";
import { AccountBadge } from "../common/AccountBadge";
import { ExpandableText } from "../common/ExpandableText";
import { colors, nicknameTextStyle, fontSize, fontWeight } from "../../lib/theme";
import { useVerifiedUsers } from "../../lib/verifiedUsers";
import type { FeedPost } from "../../features/feed/types";

type ReelFooterProps = {
  bottomInset: number;
  onPressUser: () => void;
  post: FeedPost;
};

export function ReelFooter({ bottomInset, onPressUser, post }: ReelFooterProps) {
  const { getBadge } = useVerifiedUsers();
  const badge = getBadge(post.user.id);

  return (
    <LinearGradient
      colors={["transparent", colors.scrimMed, colors.scrimMed]}
      locations={[0, 0.45, 1]}
      pointerEvents="box-none"
      style={[styles.bottom, { paddingBottom: bottomInset + 14 }]}
    >
      <Pressable onPress={onPressUser} style={styles.userRow}>
        <Avatar
          imageUrl={post.user.avatar_url}
          label={post.user.nickname}
          size={36}
        />
        <View style={styles.nicknameRow}>
          <Text numberOfLines={1} style={styles.nickname}>
            {post.user.nickname}
          </Text>
          {badge ? (
            <View style={styles.verifiedBadge}>
              <AccountBadge badge={badge} forceScheme="dark" />
            </View>
          ) : null}
        </View>
      </Pressable>
      {/* 본문 자리를 항상 확보 — 본문 유무와 상관없이 프로필 위치를 고정한다(접힘 기준) */}
      <View style={styles.captionSlot}>
        {post.content ? (
          <ExpandableText
            collapsedLines={1}
            moreStyle={styles.captionMore}
            textStyle={styles.caption}
          >
            {post.content}
          </ExpandableText>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    gap: 8,
    paddingLeft: 16,
    paddingRight: 80,
    paddingTop: 44,
    zIndex: 1,
  },
  // 접힌 본문(1줄) + 더보기 높이만큼 항상 확보 → 프로필 위치 고정. 펼치면 이 이상으로 늘어남.
  captionSlot: {
    minHeight: 42,
  },
  userRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nickname: {
    ...nicknameTextStyle,
    color: colors.white,
    fontSize: fontSize.body,
    textShadowColor: colors.scrimStrong,
    textShadowRadius: 4,
    flexShrink: 1,
  },
  nicknameRow: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  caption: {
    color: colors.white,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.normal,
    lineHeight: 20,
    textShadowColor: colors.scrimStrong,
    textShadowRadius: 4,
  },
  captionMore: {
    marginTop: 4,
    color: colors.onMediaText,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
  },
});
