import { useCallback, useEffect, useRef, useState } from "react";

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
} from "./api";

export type ActivityTab =
  | "stories"
  | "saved"
  | "liked"
  | "comments"
  | "favorites";

type ActivityTabErrors = Partial<Record<ActivityTab, string>>;
type ActivityTabLoadState = Partial<Record<ActivityTab, boolean>>;

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

// 내 활동 탭 데이터 로딩/탭 lazy load/스토리 미리보기 로직. UI/네비게이션은 화면이 담당.
export function useMyActivity() {
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

  function retryActiveTab() {
    const nextLoadedTabs = { ...loadedTabsRef.current };
    delete nextLoadedTabs[activeTab];
    loadedTabsRef.current = nextLoadedTabs;
    setLoadedTabs(nextLoadedTabs);
    void loadTab(activeTab);
  }

  const activeTabError = tabErrors[activeTab];
  const isActiveTabLoading =
    Boolean(loadingTabs[activeTab]) ||
    (!loadedTabs[activeTab] && !activeTabError);

  return {
    activeTab,
    activeTabError,
    closeStoryPreview,
    commentedPosts,
    favoriteUsers,
    isActiveTabLoading,
    isLoadingViewers,
    likedPosts,
    retryActiveTab,
    savedPosts,
    selectedStory,
    setActiveTab,
    setSelectedStory,
    stories,
    storyViewers,
  };
}
