import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ReelItem } from "../../components/feed/ReelItem";
import { CommentsSheet } from "../../components/comments/CommentsSheet";
import { StateView } from "../../components/common/StateView";
import { useReels } from "../../features/feed/useReels";
import { useSession } from "../../lib/session";
import { colors } from "../../lib/theme";

type ReelsScreenProps = {
  startPostId?: string;
};

// 릴스(영상 전용 세로 풀스크린 피드). 위아래 스와이프로 다음 영상, 보이는 1개만 재생.
export function ReelsScreen({ startPostId }: ReelsScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const currentUserId = session?.user.id ?? "";
  const { height, width } = useWindowDimensions();
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  // 음소거는 릴스 전체 공유 — 한 번 켜면 다음 영상에서도 유지.
  const [isMuted, setIsMuted] = useState(true);
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
    posts,
    removePost,
    reportPost,
    setActiveIndex,
    toggleBookmarkPost,
    toggleLike,
  } = useReels(startPostId);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;
  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const index = viewableItems[0]?.index;
      if (typeof index === "number") {
        setActiveIndex(index);
      }
    },
  ).current;

  const handleUserPress = useCallback(
    (nickname: string) => {
      router.push({ pathname: "/profile/[nickname]", params: { nickname } });
    },
    [router],
  );

  const flatListRef = useRef<FlatList>(null);
  const prevPostCountRef = useRef(0);
  const hadPostsRef = useRef(false);

  // 차단/삭제로 영상이 목록에서 빠졌을 때: 남은 영상이 있으면 그 자리(다음 영상)로 스크롤,
  // 마지막 영상까지 사라졌으면 릴스를 닫는다. (초기 로딩/에러의 빈 상태는 hadPostsRef로 구분해 안 닫음)
  useEffect(() => {
    const prevCount = prevPostCountRef.current;
    prevPostCountRef.current = posts.length;

    if (posts.length > 0) {
      hadPostsRef.current = true;
    }

    if (posts.length === 0) {
      if (hadPostsRef.current) {
        router.back();
      }
      return;
    }

    if (posts.length < prevCount) {
      const target = Math.min(activeIndex, posts.length - 1);
      flatListRef.current?.scrollToIndex({ animated: false, index: target });
    }
  }, [activeIndex, posts.length, router]);

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

  if (errorMessage && posts.length === 0) {
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
    <View style={styles.screen}>
      <StatusBar style="light" backgroundColor={colors.black} />
      <FlatList
        ref={flatListRef}
        data={posts}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          index,
          length: height,
          offset: height * index,
        })}
        initialNumToRender={2}
        initialScrollIndex={activeIndex}
        keyExtractor={(post) => post.id}
        maxToRenderPerBatch={2}
        onEndReached={() => {
          void loadMore();
        }}
        onEndReachedThreshold={1.2}
        onViewableItemsChanged={handleViewableItemsChanged}
        disableIntervalMomentum
        removeClippedSubviews
        renderItem={({ index, item }) => (
          <ReelItem
            currentUserId={currentUserId}
            height={height}
            isActive={index === activeIndex}
            // 활성 ±1만 영상 플레이어를 살린다(나머지는 source=null로 메모리 해제, 썸네일만).
            isNearActive={Math.abs(index - activeIndex) <= 1}
            isBookmarked={bookmarkedPostIds.has(item.id)}
            isLiked={likedPostIds.has(item.id)}
            isMuted={isMuted}
            onBlockUser={() => {
              void blockAuthor(item.user.id);
            }}
            onBookmark={() => {
              void toggleBookmarkPost(item.id);
            }}
            onComment={() => setCommentPostId(item.id)}
            onDelete={() => {
              void removePost(item.id);
            }}
            onLike={() => {
              void toggleLike(item.id);
            }}
            onPressUser={() => handleUserPress(item.user.nickname)}
            onReport={() => {
              void reportPost(item.id);
            }}
            onToggleMute={() => setIsMuted((muted) => !muted)}
            post={item}
            width={width}
          />
        )}
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={height}
        viewabilityConfig={viewabilityConfig}
        windowSize={3}
      />

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
    backgroundColor: "rgba(0,0,0,0.78)",
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
    paddingHorizontal: 18,
    paddingVertical: 10,
    textAlign: "center",
  },
});
