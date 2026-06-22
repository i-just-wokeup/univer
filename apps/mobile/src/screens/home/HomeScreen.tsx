import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Home,
  MessageCircle,
  Plus,
  Search,
  SquarePlay,
  UserCircle,
} from "lucide-react-native";
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { StateView } from "../../components/common/StateView";
import { CommentsSheet } from "../../components/comments/CommentsSheet";
import { FeedPostCard } from "../../components/feed/FeedPostCard";
import { getFeed, getLikedPostIds, togglePostLike } from "../../features/feed/api";
import type { FeedPost } from "../../features/feed/types";
import { getSupabaseMobileClient } from "../../lib/supabase";
import { colors } from "../../lib/theme";

type HomeScreenProps = {
  userEmail: string;
};

export function HomeScreen({ userEmail: _userEmail }: HomeScreenProps) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentSheetPostId, setCommentSheetPostId] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(() => new Set());
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const pendingLikePostIdsRef = useRef<Set<string>>(new Set());

  const loadFirstPage = useCallback(async () => {
    try {
      setErrorMessage("");
      const result = await getFeed();
      const likedIds = await getLikedPostIds(result.posts.map((post) => post.id));

      setPosts(result.posts);
      setNextCursor(result.nextCursor);
      setLikedPostIds(new Set(likedIds));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "피드를 불러오지 못했습니다.",
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
    if (!nextCursor || isLoadingMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const result = await getFeed({ cursor: nextCursor });
      const likedIds = await getLikedPostIds(result.posts.map((post) => post.id));

      setPosts((currentPosts) => [...currentPosts, ...result.posts]);
      setNextCursor(result.nextCursor);
      setLikedPostIds((currentLikedPostIds) => {
        const nextLikedPostIds = new Set(currentLikedPostIds);
        likedIds.forEach((postId) => {
          nextLikedPostIds.add(postId);
        });
        return nextLikedPostIds;
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "피드를 더 불러오지 못했습니다.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleToggleLike(postId: string) {
    if (pendingLikePostIdsRef.current.has(postId)) {
      return;
    }

    pendingLikePostIdsRef.current.add(postId);

    try {
      const result = await togglePostLike(postId);

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId ? { ...post, likes_count: result.likesCount } : post,
        ),
      );
      setLikedPostIds((currentLikedPostIds) => {
        const nextLikedPostIds = new Set(currentLikedPostIds);

        if (result.liked) {
          nextLikedPostIds.add(postId);
        } else {
          nextLikedPostIds.delete(postId);
        }

        return nextLikedPostIds;
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "좋아요를 처리하지 못했습니다.",
      );
    } finally {
      pendingLikePostIdsRef.current.delete(postId);
    }
  }

  async function handleSignOut() {
    await getSupabaseMobileClient().auth.signOut();
  }

  const handleCommentCountChange = useCallback((postId: string, nextCount: number) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId ? { ...post, comments_count: nextCount } : post,
      ),
    );
  }, []);

  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <StateView
          message="학교 피드를 불러오는 중입니다."
          title="피드 준비 중"
          type="loading"
        />
      </SafeAreaView>
    );
  }

  if (errorMessage && posts.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <HomeHeader onSignOut={handleSignOut} />
        <StateView
          actionLabel="다시 시도"
          message={errorMessage}
          onAction={() => {
            setIsInitialLoading(true);
            void loadFirstPage();
          }}
          title="피드를 불러오지 못했습니다"
          type="error"
        />
        <BottomTabBar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        ListEmptyComponent={
          <StateView
            message="같은 학교 공개 게시물이 아직 없습니다."
            title="아직 게시물이 없습니다"
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
        ListHeaderComponent={<HomeHeader onSignOut={handleSignOut} />}
        contentContainerStyle={styles.listContent}
        data={posts}
        keyExtractor={(post) => post.id}
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
          <FeedPostCard
            isLiked={likedPostIds.has(item.id)}
            onComment={setCommentSheetPostId}
            onLike={(postId) => {
              void handleToggleLike(postId);
            }}
            post={item}
          />
        )}
        style={styles.list}
      />
      {errorMessage && posts.length > 0 ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{errorMessage}</Text>
        </View>
      ) : null}
      <CommentsSheet
        isOpen={Boolean(commentSheetPostId)}
        onClose={() => {
          setCommentSheetPostId(null);
        }}
        onCommentCountChange={handleCommentCountChange}
        postId={commentSheetPostId}
      />
      <BottomTabBar />
    </SafeAreaView>
  );
}

function HomeHeader({ onSignOut }: { onSignOut: () => void }) {
  return (
    <View style={styles.headerArea}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>KREW</Text>
        <View style={styles.headerActions}>
          <View style={styles.circleButton}>
            <Bell color={colors.text} size={27} strokeWidth={2.6} />
          </View>
          <Pressable onLongPress={onSignOut} style={styles.circleButton}>
            <MessageCircle color={colors.text} size={28} strokeWidth={2.6} />
          </Pressable>
        </View>
      </View>
      <View style={styles.storyRow}>
        <View style={styles.storyCard}>
          <View style={styles.storyPlus}>
            <Plus color={colors.white} size={30} strokeWidth={2.6} />
          </View>
          <Text style={styles.storyLabel}>내 스토리</Text>
        </View>
      </View>
    </View>
  );
}

function BottomTabBar() {
  const items = [
    { key: "home", active: true, icon: Home },
    { key: "search", active: false, icon: Search },
    { key: "write", active: true, icon: Plus, primary: true },
    { key: "explore", active: false, icon: SquarePlay },
    { key: "profile", active: false, icon: UserCircle },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map(({ active, icon: Icon, key, primary }) => {
        const iconColor = primary
          ? colors.white
          : active
            ? colors.accent
            : colors.textFaint;

        return (
          <View key={key} style={primary ? styles.primaryTab : styles.navTab}>
            <Icon
              color={iconColor}
              size={primary ? 36 : 31}
              strokeWidth={primary ? 2.8 : 2.5}
            />
          </View>
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 96,
  },
  headerArea: {
    paddingBottom: 14,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 18,
    paddingTop: 12,
  },
  logo: {
    color: colors.accent,
    fontSize: 32,
    fontWeight: "900",
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  circleButton: {
    height: 52,
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: colors.white,
  },
  storyRow: {
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
  storyCard: {
    height: 176,
    width: 128,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#D9CCFA",
    borderRadius: 28,
    borderWidth: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  storyPlus: {
    height: 52,
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: colors.accent,
  },
  storyLabel: {
    marginTop: 14,
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  bottomNav: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: 78,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  navTab: {
    height: 48,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryTab: {
    height: 58,
    width: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.accent,
  },
  inlineError: {
    position: "absolute",
    right: 16,
    bottom: 96,
    left: 16,
    borderRadius: 16,
    backgroundColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inlineErrorText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
});
