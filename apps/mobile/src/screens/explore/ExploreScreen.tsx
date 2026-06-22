import { Image } from "expo-image";
import { Heart } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { StateView } from "../../components/common/StateView";
import { getExplorePosts } from "../../features/explore/api";
import type { ExplorePost } from "../../features/explore/types";
import { colors } from "../../lib/theme";

const PAGE_SIZE = 24;
const H_PADDING = 10;
const GAP = 8;

export function ExploreScreen() {
  const { width } = useWindowDimensions();
  const tileWidth = (width - H_PADDING * 2 - GAP) / 2;

  const [errorMessage, setErrorMessage] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const offsetRef = useRef(0);

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

  async function handleLoadMore() {
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
      <FlatList
        ListEmptyComponent={
          <StateView
            message="같은 학교 공개 게시물이 아직 없습니다."
            title="탐색할 게시물이 없습니다"
          />
        }
        ListFooterComponent={
          isLoadingMore ? (
            <StateView
              message="잠시만 기다려주세요."
              title="더 불러오는 중"
              type="loading"
            />
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>탐색</Text>
          </View>
        }
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        data={posts}
        keyExtractor={(post) => post.id}
        numColumns={2}
        onEndReached={() => {
          void handleLoadMore();
        }}
        onEndReachedThreshold={0.7}
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              void handleRefresh();
            }}
            refreshing={isRefreshing}
            tintColor={colors.accent}
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.tile, { width: tileWidth }]}>
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              source={{ uri: item.thumbnail_url }}
              style={styles.tileImage}
            />
            <View style={styles.likeBadge}>
              <Heart color={colors.white} fill={colors.white} size={12} />
              <Text style={styles.likeText}>{item.likes_count}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  listContent: {
    paddingBottom: 96,
  },
  columnWrapper: {
    paddingHorizontal: H_PADDING,
    justifyContent: "space-between",
    marginBottom: GAP,
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
  tile: {
    aspectRatio: 4 / 5,
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: colors.card,
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
    backgroundColor: "rgba(12,12,18,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  likeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
  },
});
