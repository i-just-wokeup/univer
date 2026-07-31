import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Heart, Play } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ExploreGridSkeleton } from "../../components/explore/ExploreGridSkeleton";
import { StateView } from "../../components/common/StateView";
import { useExploreFeed } from "../../features/explore/useExploreFeed";
import type { ExplorePost } from "../../features/explore/types";
import type { PostAspectRatio } from "../../features/feed/types";
import { triggerLightHaptic } from "../../lib/haptics";
import { colors } from "../../lib/theme";

const H_PADDING = 10;
const GAP = 8;

// 웹 ExploreGrid 규칙: 세로(portrait)만 4:5 세로 썸네일, 정사각·가로는 1:1 정사각.
function getImageAspectRatio(aspectRatio: PostAspectRatio) {
  if (aspectRatio === "portrait") {
    return 4 / 5;
  }

  return 1;
}

export function ExploreScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const tileWidth = (width - H_PADDING * 2 - GAP) / 2;
  const {
    errorMessage,
    handleLoadMore,
    handleRefresh,
    isInitialLoading,
    isLoadingMore,
    isRefreshing,
    posts,
    retry,
  } = useExploreFeed();

  // 영상이면 릴스로, 사진이면 게시물 상세로.
  const handlePressPost = useCallback(
    (post: ExplorePost) => {
      if (post.is_video) {
        router.push({ pathname: "/reels", params: { postId: post.id } });
        return;
      }
      router.push({ pathname: "/post/[id]", params: { id: post.id } });
    },
    [router],
  );

  const handlePullRefresh = useCallback(() => {
    triggerLightHaptic();
    void handleRefresh();
  }, [handleRefresh]);

  // 높이 낮은 열에 번갈아 쌓아 들쭉날쭉(masonry) 배치를 만든다.
  const columns = useMemo(() => {
    const left: ExplorePost[] = [];
    const right: ExplorePost[] = [];
    let leftHeight = 0;
    let rightHeight = 0;

    for (const post of posts) {
      const tileHeight = tileWidth / getImageAspectRatio(post.aspect_ratio);

      if (leftHeight <= rightHeight) {
        left.push(post);
        leftHeight += tileHeight + GAP;
      } else {
        right.push(post);
        rightHeight += tileHeight + GAP;
      }
    }

    return { left, right };
  }, [posts, tileWidth]);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceToBottom =
      contentSize.height - contentOffset.y - layoutMeasurement.height;

    if (distanceToBottom < 600) {
      void handleLoadMore();
    }
  }

  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <ExploreGridSkeleton />
      </SafeAreaView>
    );
  }

  if (errorMessage && posts.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <StateView
          actionLabel="다시 시도"
          message={errorMessage}
          onAction={retry}
          title="탐색 게시물을 불러오지 못했습니다"
          type="error"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            onRefresh={handlePullRefresh}
            refreshing={isRefreshing}
            tintColor={colors.accent}
          />
        }
        scrollEventThrottle={200}
      >
        <View style={styles.header}>
          <Text style={styles.title}>탐색</Text>
        </View>

        {posts.length === 0 ? (
          <StateView
            message="같은 학교 공개 게시물이 아직 없습니다."
            title="탐색할 게시물이 없습니다"
          />
        ) : (
          <View style={styles.columns}>
            <MasonryColumn
              onPressPost={handlePressPost}
              posts={columns.left}
              tileWidth={tileWidth}
            />
            <MasonryColumn
              onPressPost={handlePressPost}
              posts={columns.right}
              tileWidth={tileWidth}
            />
          </View>
        )}

        {isLoadingMore ? (
          <View style={styles.loadingMore}>
            <ActivityIndicator color={colors.accent} size="small" />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function MasonryColumn({
  onPressPost,
  posts,
  tileWidth,
}: {
  onPressPost: (post: ExplorePost) => void;
  posts: ExplorePost[];
  tileWidth: number;
}) {
  return (
    <View style={[styles.column, { width: tileWidth }]}>
      {posts.map((post) => {
        const tileHeight = tileWidth / getImageAspectRatio(post.aspect_ratio);

        return (
          <Pressable
            key={post.id}
            onPress={() => onPressPost(post)}
            style={[styles.tile, { height: tileHeight }]}
          >
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              recyclingKey={post.id}
              source={{ uri: post.thumbnail_url }}
              style={styles.tileImage}
            />
            {post.is_video ? (
              <View style={styles.videoBadge}>
                <Play color={colors.white} fill={colors.white} size={14} />
              </View>
            ) : null}
            <View style={styles.likeBadge}>
              <Heart color={colors.danger} fill={colors.danger} size={13} />
              <Text style={styles.likeText}>{post.likes_count}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
  },
  columns: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: H_PADDING,
  },
  column: {
    gap: GAP,
  },
  tile: {
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: colors.neutralFill,
  },
  tileImage: {
    height: "100%",
    width: "100%",
  },
  loadingMore: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  videoBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    height: 26,
    width: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.scrimMed,
  },
  likeBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: colors.surfaceGlass,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  likeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
});
