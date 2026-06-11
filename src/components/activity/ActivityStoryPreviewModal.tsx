import { Eye, Heart, X } from "lucide-react";
import Image from "next/image";

import { Avatar } from "@/components/common/Avatar";
import type {
  ActivityStory,
  ActivityStoryViewer,
} from "@/features/activity/api";
import { formatChatTime, formatKoreanDateTime } from "@/lib/utils/time";

import { getStoryStatus, getVisibilityLabel } from "./storyDisplay";

type ActivityStoryPreviewModalProps = {
  isLoadingViewers: boolean;
  onClose: () => void;
  story: ActivityStory;
  viewers: ActivityStoryViewer[];
};

export function ActivityStoryPreviewModal({
  isLoadingViewers,
  onClose,
  story,
  viewers,
}: ActivityStoryPreviewModalProps) {
  const likedViewers = viewers.filter((viewer) => viewer.isLiked);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8 text-white">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
        aria-label="닫기"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="flex max-h-full w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-zinc-950">
        <div className="relative aspect-[9/16] bg-black">
          <Image
            src={story.image_url}
            alt="내 스토리 크게 보기"
            fill
            sizes="(max-width: 640px) 100vw, 384px"
            className="object-contain"
          />
          <div className="absolute left-4 top-4 rounded-xl bg-black/55 px-3 py-2 text-sm font-bold">
            {formatKoreanDateTime(story.created_at)}
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-300">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              조회 {story.views_count}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" aria-hidden="true" />
              좋아요 {likedViewers.length}
            </span>
            <span>{getVisibilityLabel(story.visibility)}</span>
            <span>{getStoryStatus(story)}</span>
          </div>
        </div>

        <div className="max-h-44 overflow-y-auto border-t border-white/10 px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold">조회한 사람</p>
            <p className="text-xs font-medium text-zinc-500">
              {formatChatTime(story.created_at)}
            </p>
          </div>

          {isLoadingViewers ? (
            <p className="py-5 text-center text-xs font-semibold text-zinc-500">
              조회자 정보를 불러오는 중입니다.
            </p>
          ) : viewers.length > 0 ? (
            <ul className="space-y-3">
              {viewers.map((viewer) => (
                <li
                  key={viewer.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar
                      src={viewer.avatar_url}
                      nickname={viewer.nickname}
                      size="sm"
                      className="bg-zinc-800"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {viewer.nickname}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatChatTime(viewer.viewed_at)}
                      </p>
                    </div>
                  </div>
                  {viewer.isLiked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/15 px-2 py-1 text-xs font-bold text-pink-300">
                      <Heart
                        className="h-3 w-3 fill-current"
                        aria-hidden="true"
                      />
                      좋아요
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-5 text-center text-xs font-semibold text-zinc-500">
              아직 조회한 사람이 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
