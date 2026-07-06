import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "../common/Avatar";
import { ExpandableText } from "../common/ExpandableText";
import { colors } from "../../lib/theme";
import type { FeedPost } from "../../features/feed/types";

type ReelFooterProps = {
  bottomInset: number;
  onPressUser: () => void;
  post: FeedPost;
};

export function ReelFooter({ bottomInset, onPressUser, post }: ReelFooterProps) {
  return (
    <LinearGradient
      colors={["transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.5)"]}
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
        <Text style={styles.nickname}>{post.user.nickname}</Text>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nickname: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowRadius: 4,
  },
  caption: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowRadius: 4,
  },
  captionMore: {
    marginTop: 4,
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "800",
  },
});
