import { Star } from "lucide-react";

import { Avatar } from "@/components/common/Avatar";
import type { ActivityFavoriteUser } from "@/features/activity/api";
import { formatChatTime } from "@/lib/utils/time";

import { ActivityEmptyState } from "./ActivityEmptyState";

type ActivityFavoriteUsersListProps = {
  onOpenProfile: (nickname: string) => void;
  users: ActivityFavoriteUser[];
};

export function ActivityFavoriteUsersList({
  onOpenProfile,
  users,
}: ActivityFavoriteUsersListProps) {
  if (users.length === 0) {
    return <ActivityEmptyState message="아직 즐겨찾기한 계정이 없습니다." />;
  }

  return (
    <section className="divide-y divide-zinc-100 px-4 py-2">
      {users.map((user) => (
        <button
          key={user.id}
          type="button"
          onClick={() => onOpenProfile(user.nickname)}
          className="flex w-full items-center gap-3 py-4 text-left"
        >
          <Avatar src={user.avatar_url} nickname={user.nickname} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-sm font-bold text-zinc-950">
                {user.nickname}
              </p>
              <Star
                className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400"
                aria-hidden="true"
              />
            </div>
            <p className="mt-0.5 truncate text-xs font-medium text-zinc-500">
              {user.department}
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-zinc-400">
            {formatChatTime(user.favorited_at)}
          </span>
        </button>
      ))}
    </section>
  );
}
