"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentUserProfile } from "@/features/auth/api";
import { getStories, type StoryGroup } from "@/features/stories/api";

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

type CurrentUserProfile = Pick<
  NonNullable<Awaited<ReturnType<typeof getCurrentUserProfile>>>,
  "avatar_url" | "id" | "nickname"
>;

function MyStoryCreateItem({
  allUserIds,
  currentUserProfile,
  hasMyStory,
  myStoryGroup,
}: {
  allUserIds: string;
  currentUserProfile: CurrentUserProfile | null;
  hasMyStory: boolean;
  myStoryGroup?: StoryGroup;
}) {
  if (hasMyStory && currentUserProfile) {
    const thumbnailUrl =
      myStoryGroup?.stories[0]?.image_url ?? currentUserProfile.avatar_url;

    return (
      <div className="flex w-[82px] shrink-0 flex-col items-center text-center">
        <div className="relative">
          <Link
            href={`/story/${currentUserProfile.id}?users=${allUserIds}`}
            className="block cursor-pointer"
          >
            <StoryCard
              hasUnviewed={false}
              nickname="내 스토리"
              thumbnailUrl={thumbnailUrl}
            />
          </Link>
          <Link
            href="/story/create"
            className="absolute bottom-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-krew-accent text-white"
            aria-label="스토리 만들기"
          >
            <PlusIcon />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/story/create"
      className="flex w-[82px] shrink-0 cursor-pointer flex-col items-center text-center"
    >
      <div className="flex h-28 w-[82px] flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-krew-accent-ring bg-krew-accent-soft shadow-[0_8px_18px_rgba(20,22,30,0.08)]">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-krew-accent text-white shadow-[0_8px_18px_rgba(124,58,237,0.24)]">
          <PlusIcon />
        </span>
        <span className="text-[11px] font-extrabold text-foreground">
          내 스토리
        </span>
      </div>
    </Link>
  );
}

function StoryCard({
  hasUnviewed,
  nickname,
  thumbnailUrl,
}: {
  hasUnviewed: boolean;
  nickname: string;
  thumbnailUrl: string | null;
}) {
  const backgroundStyle = thumbnailUrl
    ? { backgroundImage: `url(${thumbnailUrl})` }
    : undefined;

  return (
    <div
      className={`relative h-28 w-[82px] overflow-hidden rounded-[20px] border-2 bg-zinc-200 bg-cover bg-center shadow-[0_8px_18px_rgba(20,22,30,0.08)] ${
        hasUnviewed ? "border-krew-accent" : "border-zinc-200"
      }`}
      style={backgroundStyle}
    >
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/55 to-transparent" />
      <span className="absolute bottom-2 left-2 right-2 truncate text-left text-[11px] font-extrabold text-white drop-shadow">
        {nickname}
      </span>
    </div>
  );
}

function StoryGroupItem({
  allUserIds,
  group,
}: {
  allUserIds: string;
  group: StoryGroup;
}) {
  const thumbnailUrl = group.stories[0]?.image_url ?? group.user.avatar_url;

  return (
    <Link
      href={`/story/${group.user.id}?users=${allUserIds}`}
      className="flex w-[82px] shrink-0 cursor-pointer flex-col items-center text-center"
    >
      <StoryCard
        hasUnviewed={group.hasUnviewed}
        nickname={group.user.nickname}
        thumbnailUrl={thumbnailUrl}
      />
    </Link>
  );
}

function StorySkeleton() {
  return (
    <div className="flex w-[82px] shrink-0 flex-col items-center">
      <div className="h-28 w-[82px] animate-pulse rounded-[20px] bg-white/70" />
    </div>
  );
}

export function StoryBar() {
  const searchParams = useSearchParams();
  const refreshStories = searchParams.get("refreshStories");
  const [currentUserProfile, setCurrentUserProfile] =
    useState<CurrentUserProfile | null>(null);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStories() {
      try {
        setIsLoading(true);
        const [loadedStoryGroups, loadedCurrentUserProfile] = await Promise.all([
          getStories(),
          getCurrentUserProfile(),
        ]);

        if (isMounted) {
          setStoryGroups(loadedStoryGroups);
          setCurrentUserProfile(
            loadedCurrentUserProfile
              ? {
                  avatar_url: loadedCurrentUserProfile.avatar_url,
                  id: loadedCurrentUserProfile.id,
                  nickname: loadedCurrentUserProfile.nickname,
                }
              : null,
          );
        }
      } catch (error) {
        console.error("스토리 목록 조회 실패", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStories();

    return () => {
      isMounted = false;
    };
  }, [refreshStories]);

  const hasMyStory = currentUserProfile
    ? storyGroups.some((group) => group.user.id === currentUserProfile.id)
    : false;
  const myStoryGroup = currentUserProfile
    ? storyGroups.find((group) => group.user.id === currentUserProfile.id)
    : undefined;
  const visibleStoryGroups = currentUserProfile
    ? storyGroups.filter((group) => group.user.id !== currentUserProfile.id)
    : storyGroups;
  const allUserIds = storyGroups.map((group) => group.user.id).join(",");

  return (
    <section className="bg-background">
      <div className="flex gap-2.5 overflow-x-auto px-4 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <MyStoryCreateItem
          allUserIds={allUserIds}
          currentUserProfile={currentUserProfile}
          hasMyStory={hasMyStory}
          myStoryGroup={myStoryGroup}
        />
        {visibleStoryGroups.map((group) => (
          <StoryGroupItem
            key={group.user.id}
            allUserIds={allUserIds}
            group={group}
          />
        ))}
        {isLoading ? (
          <>
            <StorySkeleton />
            <StorySkeleton />
          </>
        ) : null}
      </div>
    </section>
  );
}
