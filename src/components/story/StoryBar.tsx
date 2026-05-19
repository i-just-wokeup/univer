"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { Avatar } from "@/components/common/Avatar";
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

function StoryAvatarRing({
  children,
  hasUnviewed = false,
}: {
  children: ReactNode;
  hasUnviewed?: boolean;
}) {
  if (hasUnviewed) {
    return (
      <div
        className="flex h-[72px] w-[72px] items-center justify-center rounded-full p-[2.5px]"
        style={{
          background:
            "linear-gradient(135deg, #f9ce34 0%, #ee2a7b 55%, #6228d7 100%)",
        }}
      >
        <div className="flex h-full w-full items-center justify-center rounded-full bg-white p-[2px]">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-zinc-300 bg-white">
      {children}
    </div>
  );
}

function MyStoryCreateItem({
  currentUserProfile,
  hasMyStory,
}: {
  currentUserProfile: CurrentUserProfile | null;
  hasMyStory: boolean;
}) {
  if (hasMyStory && currentUserProfile) {
    return (
      <div className="flex w-[72px] shrink-0 flex-col items-center gap-2 text-center">
        <div className="relative">
          <Link
            href={`/story/${currentUserProfile.id}`}
            className="block cursor-pointer"
          >
            <StoryAvatarRing>
              <Avatar
                src={currentUserProfile.avatar_url}
                nickname={currentUserProfile.nickname}
                size="lg"
              />
            </StoryAvatarRing>
          </Link>
          <Link
            href="/story/create"
            className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-zinc-950 text-white"
            aria-label="스토리 만들기"
          >
            <PlusIcon />
          </Link>
        </div>
        <span className="line-clamp-1 w-full text-xs font-medium text-zinc-700">
          내 스토리
        </span>
      </div>
    );
  }

  return (
    <Link
      href="/story/create"
      className="flex w-[72px] shrink-0 cursor-pointer flex-col items-center gap-2 text-center"
    >
      <div className="relative">
        <div className="flex h-[72px] w-[72px] items-center justify-center">
          <Avatar
            src={currentUserProfile?.avatar_url}
            nickname={currentUserProfile?.nickname ?? "나"}
            size="lg"
          />
        </div>
        <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-zinc-950 text-white">
          <PlusIcon />
        </span>
      </div>
      <span className="line-clamp-1 w-full text-xs font-medium text-zinc-700">
        내 스토리
      </span>
    </Link>
  );
}

function StoryGroupItem({ group }: { group: StoryGroup }) {
  return (
    <Link
      href={`/story/${group.user.id}`}
      className="flex w-[72px] shrink-0 cursor-pointer flex-col items-center gap-2 text-center"
    >
      <StoryAvatarRing hasUnviewed={group.hasUnviewed}>
        <Avatar
          src={group.user.avatar_url}
          nickname={group.user.nickname}
          size="lg"
        />
      </StoryAvatarRing>
      <span className="line-clamp-1 w-full text-xs font-medium text-zinc-700">
        {group.user.nickname}
      </span>
    </Link>
  );
}

function StorySkeleton() {
  return (
    <div className="flex w-[72px] shrink-0 flex-col items-center gap-2">
      <div className="h-[72px] w-[72px] animate-pulse rounded-full bg-zinc-100" />
      <div className="h-3 w-12 animate-pulse rounded-full bg-zinc-100" />
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
  const visibleStoryGroups = currentUserProfile
    ? storyGroups.filter((group) => group.user.id !== currentUserProfile.id)
    : storyGroups;

  return (
    <section className="bg-white">
      <div className="flex gap-4 overflow-x-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <MyStoryCreateItem
          currentUserProfile={currentUserProfile}
          hasMyStory={hasMyStory}
        />
        {visibleStoryGroups.map((group) => (
          <StoryGroupItem key={group.user.id} group={group} />
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
