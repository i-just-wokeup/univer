import { memo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { FeedMediaCarousel } from "./FeedMediaCarousel";
import { triggerLightHaptic } from "../../lib/haptics";
import { colors } from "../../lib/theme";
import type { FeedPost } from "../../features/feed/types";
import { FeedPostActions } from "./FeedPostActions";
import { FeedPostContent } from "./FeedPostContent";
import { FeedPostHeader } from "./FeedPostHeader";
import { FeedPostMoreMenu } from "./FeedPostMoreMenu";

type FeedPostCardProps = {
  currentUserId?: string;
  // 피드에서 지금 보이는 카드면 영상 자동재생.
  isActive?: boolean;
  isBookmarked?: boolean;
  isLiked: boolean;
  onBlockUser?: (userId: string) => void;
  onBookmark?: (postId: string) => void;
  onComment: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onLike: (postId: string) => void;
  onReport?: (postId: string) => void;
  onShare?: (post: FeedPost) => void;
  onUserPress: (nickname: string) => void;
  // 영상 영역 탭 시(릴스 상세 이동용).
  onVideoPress?: (postId: string) => void;
  post: FeedPost;
};

function FeedPostCardComponent({
  currentUserId = "",
  isActive = false,
  isBookmarked = false,
  isLiked,
  onBlockUser,
  onBookmark,
  onComment,
  onDelete,
  onLike,
  onReport,
  onShare,
  onUserPress,
  onVideoPress,
  post,
}: FeedPostCardProps) {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  return (
    <View style={styles.card}>
      <FeedPostHeader
        onMorePress={() => setIsActionSheetOpen(true)}
        onUserPress={onUserPress}
        post={post}
      />

      <FeedMediaCarousel
        aspectRatio={post.aspect_ratio}
        isActive={isActive}
        media={post.media}
        onDoubleLike={() => {
          // 인스타식: 더블탭은 좋아요만(이미 좋아요면 애니메이션만).
          if (!isLiked) {
            triggerLightHaptic();
            onLike(post.id);
          }
        }}
        onVideoPress={onVideoPress ? () => onVideoPress(post.id) : undefined}
      />

      <FeedPostActions
        hasContent={Boolean(post.content)}
        isBookmarked={isBookmarked}
        isLiked={isLiked}
        onBookmark={onBookmark}
        onComment={onComment}
        onLike={onLike}
        onShare={onShare}
        post={post}
      />

      <FeedPostContent post={post} />

      <FeedPostMoreMenu
        currentUserId={currentUserId}
        isBookmarked={isBookmarked}
        isOpen={isActionSheetOpen}
        onBlockUser={onBlockUser}
        onBookmark={onBookmark}
        onClose={() => setIsActionSheetOpen(false)}
        onDelete={onDelete}
        onReport={onReport}
        onShare={onShare}
        post={post}
      />
    </View>
  );
}

export const FeedPostCard = memo(FeedPostCardComponent);

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: colors.white,
  },
});
