import Image from "next/image";

import type { ActivityStory } from "@/features/activity/api";
import { formatStoryArchiveDate } from "@/lib/utils/time";

import { ActivityEmptyState } from "./ActivityEmptyState";
import { getStoryStatus, getVisibilityLabel } from "./storyDisplay";

type ActivityStoryGridProps = {
  onSelectStory: (story: ActivityStory) => void;
  stories: ActivityStory[];
};

export function ActivityStoryGrid({
  onSelectStory,
  stories,
}: ActivityStoryGridProps) {
  if (stories.length === 0) {
    return <ActivityEmptyState message="아직 올린 스토리가 없습니다." />;
  }

  return (
    <section className="grid grid-cols-3 gap-px bg-white px-4 py-4">
      {stories.map((story) => {
        const status = getStoryStatus(story);

        return (
          <button
            key={story.id}
            type="button"
            onClick={() => onSelectStory(story)}
            className="group relative aspect-square overflow-hidden bg-zinc-100 text-left"
          >
            <Image
              src={story.image_url}
              alt="내 스토리"
              fill
              sizes="(max-width: 640px) 33vw, 160px"
              className="object-cover transition group-hover:scale-105"
            />
            <span className="absolute left-2 top-2 rounded-lg bg-black/80 px-2 py-1 text-[11px] font-bold text-white">
              {formatStoryArchiveDate(story.created_at)}
            </span>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <div className="flex flex-wrap gap-1">
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-zinc-900">
                  {status}
                </span>
                <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white">
                  {getVisibilityLabel(story.visibility)}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </section>
  );
}
