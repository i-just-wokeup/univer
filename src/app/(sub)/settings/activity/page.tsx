"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ActivityEmptyState } from "@/components/activity/ActivityEmptyState";
import { ActivityFavoriteUsersList } from "@/components/activity/ActivityFavoriteUsersList";
import { ActivityHeader } from "@/components/activity/ActivityHeader";
import { ActivityLoadingGrid } from "@/components/activity/ActivityLoadingGrid";
import { ActivitySavedPostsGrid } from "@/components/activity/ActivitySavedPostsGrid";
import { ActivityStoryGrid } from "@/components/activity/ActivityStoryGrid";
import { ActivityStoryPreviewModal } from "@/components/activity/ActivityStoryPreviewModal";
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
} from "@/features/activity/api";

type ActivityTab = "stories" | "saved" | "liked" | "comments" | "favorites";
type ActivityTabErrors = Partial<Record<ActivityTab, string>>;

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

function getLoadErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export default function ActivityPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActivityTab>("stories");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingViewers, setIsLoadingViewers] = useState(false);
  const [tabErrors, setTabErrors] = useState<ActivityTabErrors>({});
  const [commentedPosts, setCommentedPosts] = useState<ActivityPost[]>([]);
  const [favoriteUsers, setFavoriteUsers] = useState<ActivityFavoriteUser[]>([]);
  const [likedPosts, setLikedPosts] = useState<ActivityPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<ActivityPost[]>([]);
  const [selectedStory, setSelectedStory] = useState<ActivityStory | null>(null);
  const [stories, setStories] = useState<ActivityStory[]>([]);
  const [storyViewers, setStoryViewers] = useState<ActivityStoryViewer[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadActivity() {
      setIsLoading(true);
      setTabErrors({});

      const [
        storiesResult,
        savedPostsResult,
        likedPostsResult,
        commentedPostsResult,
        favoriteUsersResult,
      ] = await Promise.allSettled([
        getMyStories(),
        getSavedPosts(),
        getLikedPosts(),
        getCommentedPosts(),
        getFavoriteUsers(),
      ]);

      if (!isMounted) {
        return;
      }

      const nextTabErrors: ActivityTabErrors = {};

      if (storiesResult.status === "fulfilled") {
        setStories(storiesResult.value);
      } else {
        nextTabErrors.stories = getLoadErrorMessage(
          storiesResult.reason,
          activityLoadErrorMessages.stories,
        );
      }

      if (savedPostsResult.status === "fulfilled") {
        setSavedPosts(savedPostsResult.value);
      } else {
        nextTabErrors.saved = getLoadErrorMessage(
          savedPostsResult.reason,
          activityLoadErrorMessages.saved,
        );
      }

      if (likedPostsResult.status === "fulfilled") {
        setLikedPosts(likedPostsResult.value);
      } else {
        nextTabErrors.liked = getLoadErrorMessage(
          likedPostsResult.reason,
          activityLoadErrorMessages.liked,
        );
      }

      if (commentedPostsResult.status === "fulfilled") {
        setCommentedPosts(commentedPostsResult.value);
      } else {
        nextTabErrors.comments = getLoadErrorMessage(
          commentedPostsResult.reason,
          activityLoadErrorMessages.comments,
        );
      }

      if (favoriteUsersResult.status === "fulfilled") {
        setFavoriteUsers(favoriteUsersResult.value);
      } else {
        nextTabErrors.favorites = getLoadErrorMessage(
          favoriteUsersResult.reason,
          activityLoadErrorMessages.favorites,
        );
      }

      setTabErrors(nextTabErrors);

      if (isMounted) {
        setIsLoading(false);
      }
    }

    void loadActivity().catch(() => {
      if (isMounted) {
        setTabErrors(activityLoadErrorMessages);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

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

  function renderActiveTab() {
    if (isLoading) {
      return <ActivityLoadingGrid />;
    }

    const activeTabError = tabErrors[activeTab];

    if (activeTabError) {
      return <ActivityEmptyState message={activeTabError} />;
    }

    if (activeTab === "stories") {
      return (
        <ActivityStoryGrid
          stories={stories}
          onSelectStory={(story) => setSelectedStory(story)}
        />
      );
    }

    if (activeTab === "saved") {
      return (
        <ActivitySavedPostsGrid
          posts={savedPosts}
          onOpenPost={(postId) => router.push(`/posts/${postId}`)}
        />
      );
    }

    if (activeTab === "liked") {
      return (
        <ActivitySavedPostsGrid
          emptyMessage="아직 좋아요한 게시물이 없습니다."
          posts={likedPosts}
          onOpenPost={(postId) => router.push(`/posts/${postId}`)}
        />
      );
    }

    if (activeTab === "comments") {
      return (
        <ActivitySavedPostsGrid
          emptyMessage="아직 댓글 단 게시물이 없습니다."
          posts={commentedPosts}
          onOpenPost={(postId) => router.push(`/posts/${postId}`)}
        />
      );
    }

    return (
      <ActivityFavoriteUsersList
        users={favoriteUsers}
        onOpenProfile={(nickname) =>
          router.push(`/profile/${encodeURIComponent(nickname)}`)
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 text-zinc-950">
      <ActivityHeader
        activeTab={activeTab}
        tabs={tabs}
        onBack={() => router.back()}
        onChangeTab={setActiveTab}
      />

      <main>{renderActiveTab()}</main>

      {selectedStory ? (
        <ActivityStoryPreviewModal
          story={selectedStory}
          viewers={storyViewers}
          isLoadingViewers={isLoadingViewers}
          onClose={closeStoryPreview}
        />
      ) : null}
    </div>
  );
}
