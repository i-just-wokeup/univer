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
    <section className="mx-4 mt-4 rounded-[22px] border border-white/70 bg-white/82 p-2 shadow-[var(--krew-card-shadow)]">
      {users.map((user) => (
        <button
          key={user.id}
          type="button"
          onClick={() => onOpenProfile(user.nickname)}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-krew-accent-soft"
        >
          <Avatar src={user.avatar_url} nickname={user.nickname} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-sm font-extrabold text-foreground">
                {user.nickname}
              </p>
              <Star
                className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400"
                aria-hidden="true"
              />
            </div>
            <p className="mt-0.5 truncate text-xs font-semibold text-krew-muted">
              {user.department}
            </p>
          </div>
          <span className="shrink-0 text-xs font-semibold text-krew-faint">
            {formatChatTime(user.favorited_at)}
          </span>
        </button>
      ))}
    </section>
  );
}
