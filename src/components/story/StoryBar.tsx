"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/common/Avatar";
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

function MyStoryCreateItem() {
  return (
    <Link
      href="/story/create"
      className="flex w-[72px] shrink-0 cursor-pointer flex-col items-center gap-2 text-center"
    >
      <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-zinc-300 bg-white">
        <div className="flex h-[66px] w-[66px] items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700">
          나
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
  const borderClass = group.hasUnviewed
    ? "border-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
    : "border-zinc-300";

  return (
    <Link
      href={`/story/${group.user.id}`}
      className="flex w-[72px] shrink-0 cursor-pointer flex-col items-center gap-2 text-center"
    >
      <div
        className={`flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 bg-white ${borderClass}`}
      >
        <Avatar
          src={group.user.avatar_url}
          nickname={group.user.nickname}
          size="md"
        />
      </div>
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
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStories() {
      try {
        setIsLoading(true);
        const loadedStoryGroups = await getStories();

        if (isMounted) {
          setStoryGroups(loadedStoryGroups);
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

  const hasMyStory = storyGroups[0]?.user.nickname === "나";

  return (
    <section className="bg-white">
      <div className="flex gap-4 overflow-x-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {!hasMyStory ? <MyStoryCreateItem /> : null}
        {storyGroups.map((group) => (
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
