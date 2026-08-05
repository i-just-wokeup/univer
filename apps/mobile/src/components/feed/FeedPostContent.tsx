import { StyleSheet, Text, View } from "react-native";

import { ExpandableText } from "../common/ExpandableText";
import { nicknameTextStyle, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import type { FeedPost } from "../../features/feed/types";

type FeedPostContentProps = {
  post: FeedPost;
};

export function FeedPostContent({ post }: FeedPostContentProps) {
  const styles = useThemedStyles(makeStyles);

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

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  contentWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  content: {
    color: c.text,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.normal,
    lineHeight: 20,
  },
  contentMore: {
    marginTop: 4,
    color: c.muted,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.bold,
  },
  contentNickname: {
    fontWeight: nicknameTextStyle.fontWeight,
    color: c.text,
  },
});
