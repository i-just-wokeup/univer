import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Heart } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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

import { StateView } from "../../components/common/StateView";
import { getExplorePosts } from "../../features/explore/api";
import type { ExplorePost } from "../../features/explore/types";
import type { PostAspectRatio } from "../../features/feed/types";
import { colors } from "../../lib/theme";

const PAGE_SIZE = 24;
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

  const handlePressPost = useCallback(
    (postId: string) => {
      router.push({ pathname: "/post/[id]", params: { id: postId } });
    },
    [router],
  );

  const [errorMessage, setErrorMessage] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const offsetRef = useRef(0);

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

  const loadFirstPage = useCallback(async () => {
    try {
      setErrorMessage("");
      const result = await getExplorePosts({ limit: PAGE_SIZE, offset: 0 });
      setPosts(result.posts);
      setHasMore(result.hasMore);
      offsetRef.current = PAGE_SIZE;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "탐색 게시물을 불러오지 못했습니다.",
      );
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadFirstPage();
  }

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const result = await getExplorePosts({
        limit: PAGE_SIZE,
        offset: offsetRef.current,
      });
      setPosts((current) => [...current, ...result.posts]);
      setHasMore(result.hasMore);
      offsetRef.current += PAGE_SIZE;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "탐색 게시물을 더 불러오지 못했습니다.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore]);

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
        <StateView
          message="같은 학교 게시물을 불러오는 중입니다."
          title="탐색 준비 중"
          type="loading"
        />
      </SafeAreaView>
    );
  }

  if (errorMessage && posts.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <StateView
          actionLabel="다시 시도"
          message={errorMessage}
          onAction={() => {
            setIsInitialLoading(true);
            void loadFirstPage();
          }}
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
            onRefresh={() => {
              void handleRefresh();
            }}
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
          <StateView
            message="잠시만 기다려주세요."
            title="더 불러오는 중"
            type="loading"
          />
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
  onPressPost: (postId: string) => void;
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
            onPress={() => onPressPost(post.id)}
            style={[styles.tile, { height: tileHeight }]}
          >
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              source={{ uri: post.thumbnail_url }}
              style={styles.tileImage}
            />
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
    backgroundColor: "#F4F4F5",
  },
  tileImage: {
    height: "100%",
    width: "100%",
  },
  likeBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.86)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  likeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
});
