import { StyleSheet, Text, View } from "react-native";

import type { ProfileGridPost } from "../../features/profile/types";
import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { PostThumbnailGrid } from "../common/PostThumbnailGrid";

type ProfilePostGridSectionProps = {
  onPressPost: (postId: string) => void;
  posts: ProfileGridPost[];
};

export function ProfilePostGridSection({
  onPressPost,
  posts,
}: ProfilePostGridSectionProps) {
  const styles = useThemedStyles(makeStyles);

  if (posts.length === 0) {
    return (
      <View style={styles.emptyGrid}>
        <Text style={styles.emptyText}>아직 게시물이 없습니다</Text>
      </View>
    );
  }

  return <PostThumbnailGrid items={posts} onPressItem={onPressPost} themed />;
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  emptyGrid: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    color: c.muted,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semibold,
  },
});
