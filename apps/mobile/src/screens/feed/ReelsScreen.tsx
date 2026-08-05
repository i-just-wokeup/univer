import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ReelItem } from "../../components/feed/ReelItem";
import { CommentsSheet } from "../../components/comments/CommentsSheet";
import { PostShareSheet } from "../../components/feed/PostShareSheet";
import { StateView } from "../../components/common/StateView";
import { usePostShare, type PostShareTarget } from "../../features/chat/usePostShare";
import { useReels } from "../../features/feed/useReels";
import type { FeedPost, ReelFeedItem } from "../../features/feed/types";
import { useSession } from "../../lib/session";
import { SITE_URL } from "../../lib/site";
import { colors, fontSize, fontWeight } from "../../lib/theme";

type ReelsScreenProps = {
  startPostId?: string;
};

// 릴스(영상 전용 세로 풀스크린 피드). 위아래 스와이프로 다음 영상, 보이는 1개만 재생.
export function ReelsScreen({ startPostId }: ReelsScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const currentUserId = session?.user.id ?? "";
  // 아이템 크기는 useWindowDimensions(상태바 뺀 값이라 실제 화면과 28px 어긋남) 대신
  // FlatList 컨테이너의 실제 크기를 onLayout으로 재서 쓴다 → 어떤 폰/비율이든 칸=화면이 딱 맞아
  // "다음 릴스 삐져나옴 / 마지막 릴스 밀림"이 사라진다.
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [sharePost, setSharePost] = useState<FeedPost | null>(null);
  // 음소거는 릴스 전체 공유 — 한 번 켜면 다음 영상에서도 유지.
  const [isMuted, setIsMuted] = useState(true);
  const {
    errorMessage: shareErrorMessage,
    isLoading: isShareLoading,
    isSearching: isShareSearching,
    query: shareQuery,
    sendingTargetId,
    setQuery: setShareQuery,
    sharePostToTarget,
    visibleTargets: shareTargets,
  } = usePostShare(Boolean(sharePost));
  const {
    activeIndex,
    blockAuthor,
    bookmarkedPostIds,
    errorMessage,
    feedback,
    handleCommentCountChange,
    isLoading,
    likedPostIds,
    loadMore,
    reelItems,
    removePost,
    reportPost,
    setActiveIndex,
    showFeedback,
    toggleBookmarkPost,
    toggleLike,
  } = useReels(startPostId);
  const [visibleIndex, setVisibleIndex] = useState(activeIndex);

  const handleUserPress = useCallback(
    (nickname: string) => {
      router.push({ pathname: "/profile/[nickname]", params: { nickname } });
    },
    [router],
  );

  const handleSelectShareTarget = useCallback(
    async (target: PostShareTarget) => {
      if (!sharePost) {
        return;
      }

      const conversationId = await sharePostToTarget(sharePost.id, target.id);

      if (!conversationId) {
        return;
      }

      setSharePost(null);
      showFeedback("게시물을 보냈어요");
    },
    [sharePost, sharePostToTarget, showFeedback],
  );

  const flatListRef = useRef<FlatList<ReelFeedItem>>(null);
  const prevPostCountRef = useRef(0);
  const hadPostsRef = useRef(false);
  const reelActionsRef = useRef({
    blockAuthor,
    loadMore,
    removePost,
    reportPost,
    toggleBookmarkPost,
    toggleLike,
  });
  reelActionsRef.current = {
    blockAuthor,
    loadMore,
    removePost,
    reportPost,
    toggleBookmarkPost,
    toggleLike,
  };
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;
  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visibleItem = viewableItems.find(
        (item) => item.isViewable && typeof item.index === "number",
      );
      const index = visibleItem?.index;

      if (typeof index === "number") {
        setVisibleIndex((current) => (current === index ? current : index));
      }
    },
  ).current;

  const handleBlockUser = useCallback((userId: string) => {
    void reelActionsRef.current.blockAuthor(userId);
  }, []);
  const handleBookmark = useCallback((postId: string) => {
    void reelActionsRef.current.toggleBookmarkPost(postId);
  }, []);
  const handleComment = useCallback((postId: string) => {
    setCommentPostId(postId);
  }, []);
  const handleDelete = useCallback((postId: string) => {
    void reelActionsRef.current.removePost(postId);
  }, []);
  const handleLike = useCallback((postId: string) => {
    void reelActionsRef.current.toggleLike(postId);
  }, []);
  const handleReport = useCallback((postId: string) => {
    void reelActionsRef.current.reportPost(postId);
  }, []);
  const handleShare = useCallback((post: FeedPost) => {
    setSharePost(post);
  }, []);
  const handleToggleMute = useCallback(() => {
    setIsMuted((muted) => !muted);
  }, []);
  const handleLoadMore = useCallback(() => {
    void reelActionsRef.current.loadMore();
  }, []);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (size.height <= 0 || reelItems.length === 0) {
        return;
      }

      const offsetY = event.nativeEvent.contentOffset.y;
      const landedIndex = Math.min(
        reelItems.length - 1,
        Math.max(0, Math.round(offsetY / size.height)),
      );

      setVisibleIndex(landedIndex);
      setActiveIndex((current) =>
        current === landedIndex ? current : landedIndex,
      );
    },
    [reelItems.length, setActiveIndex, size.height],
  );

  // 차단/삭제로 영상이 목록에서 빠졌을 때: 남은 영상이 있으면 그 자리(다음 영상)로 스크롤,
  // 마지막 영상까지 사라졌으면 릴스를 닫는다. (초기 로딩/에러의 빈 상태는 hadPostsRef로 구분해 안 닫음)
  useEffect(() => {
    const prevCount = prevPostCountRef.current;
    prevPostCountRef.current = reelItems.length;

    if (reelItems.length > 0) {
      hadPostsRef.current = true;
    }

    if (reelItems.length === 0) {
      if (hadPostsRef.current) {
        router.back();
      }
      return;
    }

    if (reelItems.length < prevCount) {
      const target = Math.min(activeIndex, reelItems.length - 1);
      setVisibleIndex(target);
      flatListRef.current?.scrollToIndex({ animated: false, index: target });
    }
  }, [activeIndex, reelItems.length, router]);

  const renderReelItem = useCallback(
    ({ index, item }: ListRenderItemInfo<ReelFeedItem>) => {
      const post = item.post;

      return (
        <ReelItem
          currentUserId={currentUserId}
          height={size.height}
          isActive={index === activeIndex}
          // 보이는 릴스 ±1만 소스를 유지한다. 재생 전환은 activeIndex로 별도 제어한다.
          isNearActive={Math.abs(index - visibleIndex) <= 1}
          isBookmarked={bookmarkedPostIds.has(post.id)}
          isLiked={likedPostIds.has(post.id)}
          isMuted={isMuted}
          onBlockUser={handleBlockUser}
          onBookmark={handleBookmark}
          onComment={handleComment}
          onDelete={handleDelete}
          onLike={handleLike}
          onPressUser={handleUserPress}
          onReport={handleReport}
          onShare={handleShare}
          onToggleMute={handleToggleMute}
          post={post}
          width={size.width}
        />
      );
    },
    [
      activeIndex,
      bookmarkedPostIds,
      currentUserId,
      handleBlockUser,
      handleBookmark,
      handleComment,
      handleDelete,
      handleLike,
      handleReport,
      handleShare,
      handleToggleMute,
      handleUserPress,
      isMuted,
      likedPostIds,
      size.height,
      size.width,
      visibleIndex,
    ],
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <StateView
          message="영상을 불러오는 중입니다."
          title="릴스 준비 중"
          type="loading"
        />
      </View>
    );
  }

  if (errorMessage && reelItems.length === 0) {
    return (
      <View style={styles.center}>
        <StateView
          message={errorMessage}
          title="영상을 불러오지 못했습니다"
          type="error"
        />
      </View>
    );
  }

  return (
    <View
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize((prev) =>
          prev.width === width && prev.height === height
            ? prev
            : { width, height },
        );
      }}
      style={styles.screen}
    >
      {size.height > 0 ? (
        <FlatList
          ref={flatListRef}
          data={reelItems}
          getItemLayout={(_, index) => ({
            index,
            length: size.height,
            offset: size.height * index,
          })}
          initialNumToRender={2}
          initialScrollIndex={activeIndex}
          keyExtractor={(item) => item.itemKey}
          maxToRenderPerBatch={2}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={1.2}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onViewableItemsChanged={handleViewableItemsChanged}
          pagingEnabled
          removeClippedSubviews
          renderItem={renderReelItem}
          showsVerticalScrollIndicator={false}
          viewabilityConfig={viewabilityConfig}
          windowSize={3}
        />
      ) : null}

      <Pressable
        accessibilityLabel="뒤로"
        accessibilityRole="button"
        onPress={() => router.back()}
        style={[styles.backButton, { top: insets.top + 8 }]}
      >
        <ChevronLeft color={colors.white} size={28} strokeWidth={2.6} />
      </Pressable>

      <CommentsSheet
        isOpen={commentPostId !== null}
        onClose={() => setCommentPostId(null)}
        onCommentCountChange={handleCommentCountChange}
        onUserPress={(nickname) => {
          setCommentPostId(null);
          handleUserPress(nickname);
        }}
        postId={commentPostId}
      />

      <PostShareSheet
        errorMessage={shareErrorMessage}
        externalShareUrl={
          sharePost?.visibility === "public"
            ? `${SITE_URL}/p/${sharePost.id}`
            : null
        }
        isLoading={isShareLoading}
        isOpen={Boolean(sharePost)}
        isSearching={isShareSearching}
        onClose={() => setSharePost(null)}
        onQueryChange={setShareQuery}
        onSelectTarget={(target) => {
          void handleSelectShareTarget(target);
        }}
        query={shareQuery}
        sendingTargetId={sendingTargetId}
        targets={shareTargets}
      />

      {feedback ? (
        <View
          pointerEvents="none"
          style={[styles.feedback, { bottom: insets.bottom + 120 }]}
        >
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.black,
  },
  center: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 12,
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  feedback: {
    position: "absolute",
    left: 24,
    right: 24,
    alignItems: "center",
  },
  feedbackText: {
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: colors.scrimHeavy,
    color: colors.white,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.bold,
    paddingHorizontal: 18,
    paddingVertical: 10,
    textAlign: "center",
  },
});
