import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityFavoriteUserRow } from "../../components/activity/ActivityFavoriteUserRow";
import { ActivityPostGrid } from "../../components/activity/ActivityPostGrid";
import { ActivityStoryGrid } from "../../components/activity/ActivityStoryGrid";
import { ActivityStoryPreviewSheet } from "../../components/activity/ActivityStoryPreviewSheet";
import { ScreenHeader } from "../../components/common/ScreenHeader";
import { StateView } from "../../components/common/StateView";
import {
  getActivityStoryViewers,
  getCommentedPosts,
  getFavoriteUsers,
  getLikedPosts,
  getMyStories,
  getSavedPosts,
  type ActivityFavoriteUser,
  type ActivityPost,
  type ActivityStory,
  type ActivityStoryViewer,
} from "../../features/activity/api";
import { colors } from "../../lib/theme";

type ActivityTab = "stories" | "saved" | "liked" | "comments" | "favorites";
type ActivityTabErrors = Partial<Record<ActivityTab, string>>;
type ActivityTabLoadState = Partial<Record<ActivityTab, boolean>>;

const tabs: Array<{ id: ActivityTab; label: string }> = [
  { id: "stories", label: "스토리" },
  { id: "saved", label: "저장됨" },
  { id: "liked", label: "좋아요" },
  { id: "comments", label: "댓글" },
  { id: "favorites", label: "즐겨찾기" },
];

const activityLoadErrorMessages: Record<ActivityTab, string> = {
  comments: "댓글 단 게시물을 불러오지 못했습니다.",
  favorites: "즐겨찾기 계정을 불러오지 못했습니다.",
  liked: "좋아요한 게시물을 불러오지 못했습니다.",
  saved: "저장한 게시물을 불러오지 못했습니다.",
  stories: "스토리 보관함을 불러오지 못했습니다.",
};

const backgroundPrefetchTabs: ActivityTab[] = ["saved", "liked", "comments"];

function getLoadErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function MyActivityScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActivityTab>("stories");
  const [isLoadingViewers, setIsLoadingViewers] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState<ActivityTabLoadState>({});
  const [loadingTabs, setLoadingTabs] = useState<ActivityTabLoadState>({});
  const [tabErrors, setTabErrors] = useState<ActivityTabErrors>({});
  const loadedTabsRef = useRef<ActivityTabLoadState>({});
  const loadingTabsRef = useRef<ActivityTabLoadState>({});
  const isPageMountedRef = useRef(false);
  const hasStartedBackgroundPrefetchRef = useRef(false);
  const [commentedPosts, setCommentedPosts] = useState<ActivityPost[]>([]);
  const [favoriteUsers, setFavoriteUsers] = useState<ActivityFavoriteUser[]>([]);
  const [likedPosts, setLikedPosts] = useState<ActivityPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<ActivityPost[]>([]);
  const [selectedStory, setSelectedStory] = useState<ActivityStory | null>(null);
  const [stories, setStories] = useState<ActivityStory[]>([]);
  const [storyViewers, setStoryViewers] = useState<ActivityStoryViewer[]>([]);

  useEffect(() => {
    isPageMountedRef.current = true;

    return () => {
      isPageMountedRef.current = false;
    };
  }, []);

  const loadTab = useCallback(
    async (tab: ActivityTab, options?: { silent?: boolean }) => {
      if (loadedTabsRef.current[tab] || loadingTabsRef.current[tab]) {
        return;
      }

      const nextLoadingTabs = {
        ...loadingTabsRef.current,
        [tab]: true,
      };
      loadingTabsRef.current = nextLoadingTabs;

      if (!options?.silent) {
        setLoadingTabs(nextLoadingTabs);
      }

      setTabErrors((currentTabErrors) => {
        const nextTabErrors = { ...currentTabErrors };
        delete nextTabErrors[tab];
        return nextTabErrors;
      });

      try {
        if (tab === "stories") {
          const nextStories = await getMyStories();

          if (isPageMountedRef.current) {
            setStories(nextStories);
          }
        } else if (tab === "saved") {
          const nextSavedPosts = await getSavedPosts();

          if (isPageMountedRef.current) {
            setSavedPosts(nextSavedPosts);
          }
        } else if (tab === "liked") {
          const nextLikedPosts = await getLikedPosts();

          if (isPageMountedRef.current) {
            setLikedPosts(nextLikedPosts);
          }
        } else if (tab === "comments") {
          const nextCommentedPosts = await getCommentedPosts();

          if (isPageMountedRef.current) {
            setCommentedPosts(nextCommentedPosts);
          }
        } else {
          const nextFavoriteUsers = await getFavoriteUsers();

          if (isPageMountedRef.current) {
            setFavoriteUsers(nextFavoriteUsers);
          }
        }

        if (isPageMountedRef.current) {
          const nextLoadedTabs = {
            ...loadedTabsRef.current,
            [tab]: true,
          };
          loadedTabsRef.current = nextLoadedTabs;
          setLoadedTabs(nextLoadedTabs);
        }
      } catch (loadError) {
        if (isPageMountedRef.current) {
          setTabErrors((currentTabErrors) => ({
            ...currentTabErrors,
            [tab]: getLoadErrorMessage(
              loadError,
              activityLoadErrorMessages[tab],
            ),
          }));
        }
      } finally {
        if (isPageMountedRef.current) {
          const nextLoadingTabs = {
            ...loadingTabsRef.current,
            [tab]: false,
          };
          loadingTabsRef.current = nextLoadingTabs;

          if (!options?.silent) {
            setLoadingTabs(nextLoadingTabs);
          }
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadTab(activeTab);
  }, [activeTab, loadTab]);

  useEffect(() => {
    if (!loadedTabs.stories || hasStartedBackgroundPrefetchRef.current) {
      return;
    }

    hasStartedBackgroundPrefetchRef.current = true;
    const timerId = setTimeout(() => {
      backgroundPrefetchTabs.forEach((tab) => {
        void loadTab(tab, { silent: true });
      });
    }, 300);

    return () => {
      clearTimeout(timerId);
    };
  }, [loadedTabs.stories, loadTab]);

  useEffect(() => {
    if (!selectedStory) {
      return;
    }

    let isMounted = true;
    const storyId = selectedStory.id;

    async function loadStoryViewers() {
      try {
        setIsLoadingViewers(true);
        const nextViewers = await getActivityStoryViewers(storyId);

        if (!isMounted) {
          return;
        }

        setStoryViewers(nextViewers);
      } catch {
        if (isMounted) {
          setStoryViewers([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingViewers(false);
        }
      }
    }

    void loadStoryViewers();

    return () => {
      isMounted = false;
    };
  }, [selectedStory]);

  function closeStoryPreview() {
    setSelectedStory(null);
    setStoryViewers([]);
    setIsLoadingViewers(false);
  }

  function openPost(postId: string) {
    router.push({ pathname: "/post/[id]", params: { id: postId } });
  }

  function openProfile(nickname: string) {
    router.push({ pathname: "/profile/[nickname]", params: { nickname } });
  }

  function renderActiveTab() {
    const activeTabError = tabErrors[activeTab];
    const isActiveTabLoading =
      Boolean(loadingTabs[activeTab]) ||
      (!loadedTabs[activeTab] && !activeTabError);

    if (isActiveTabLoading) {
      return (
        <StateView
          message="활동 내역을 불러오는 중입니다."
          title="불러오는 중"
          type="loading"
        />
      );
    }

    if (activeTabError) {
      return (
        <StateView
          actionLabel="다시 시도"
          message={activeTabError}
          onAction={() => {
            const nextLoadedTabs = { ...loadedTabsRef.current };
            delete nextLoadedTabs[activeTab];
            loadedTabsRef.current = nextLoadedTabs;
            setLoadedTabs(nextLoadedTabs);
            void loadTab(activeTab);
          }}
          title="불러오지 못했습니다"
          type="error"
        />
      );
    }

    if (activeTab === "stories") {
      return (
        <ActivityStoryGrid
          onSelectStory={(story) => setSelectedStory(story)}
          stories={stories}
        />
      );
    }

    if (activeTab === "saved") {
      return <ActivityPostGrid onOpenPost={openPost} posts={savedPosts} />;
    }

    if (activeTab === "liked") {
      return (
        <ActivityPostGrid
          emptyMessage="아직 좋아요한 게시물이 없습니다."
          onOpenPost={openPost}
          posts={likedPosts}
        />
      );
    }

    if (activeTab === "comments") {
      return (
        <ActivityPostGrid
          emptyMessage="아직 댓글 단 게시물이 없습니다."
          onOpenPost={openPost}
          posts={commentedPosts}
        />
      );
    }

    if (favoriteUsers.length === 0) {
      return (
        <StateView
          message="아직 즐겨찾기한 계정이 없습니다."
          title="즐겨찾기 없음"
          type="empty"
        />
      );
    }

    return (
      <View style={styles.favoriteSurface}>
        {favoriteUsers.map((user) => (
          <ActivityFavoriteUserRow
            key={user.id}
            onPress={openProfile}
            user={user}
          />
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScreenHeader onBack={() => router.back()} title="내 활동" />
      <View style={styles.tabsWrap}>
        <ScrollView
          contentContainerStyle={styles.tabsContent}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tab, isActive ? styles.activeTab : null]}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive ? styles.activeTabText : null,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {renderActiveTab()}
      </ScrollView>
      <ActivityStoryPreviewSheet
        isLoadingViewers={isLoadingViewers}
        onClose={closeStoryPreview}
        story={selectedStory}
        viewers={storyViewers}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  tabsWrap: {
    paddingVertical: 10,
  },
  tabsContent: {
    gap: 8,
    paddingHorizontal: 16,
  },
  tab: {
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.78)",
    paddingHorizontal: 16,
  },
  activeTab: {
    backgroundColor: colors.accent,
  },
  tabText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
  },
  activeTabText: {
    color: colors.white,
  },
  content: {
    paddingHorizontal: 4,
    paddingBottom: 40,
  },
  favoriteSurface: {
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 24,
    backgroundColor: colors.card,
    padding: 6,
  },
});
