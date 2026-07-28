import { StyleSheet, Text, View } from "react-native";

import { ExpandableText } from "../common/ExpandableText";
import { colors } from "../../lib/theme";
import type { FeedPost } from "../../features/feed/types";

type FeedPostContentProps = {
  post: FeedPost;
};

export function FeedPostContent({ post }: FeedPostContentProps) {
  if (!post.content) {
    return null;
  }

  return (
    <View style={styles.contentWrap}>
      <ExpandableText
        collapsedLines={3}
        moreStyle={styles.contentMore}
        textStyle={styles.content}
      >
        <Text style={styles.contentNickname}>{post.user.nickname} </Text>
        {post.content}
      </ExpandableText>
    </View>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  content: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
  contentMore: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  contentNickname: {
    fontWeight: "900",
  },
});
