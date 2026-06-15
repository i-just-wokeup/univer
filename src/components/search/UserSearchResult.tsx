"use client";

import { Avatar } from "@/components/common/Avatar";
import type { SearchUser } from "@/features/search/api";

type UserSearchResultProps = {
  onClick: () => void;
  user: SearchUser;
};

export function UserSearchResult({ onClick, user }: UserSearchResultProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-krew-accent-soft"
    >
      <Avatar src={user.avatar_url} nickname={user.nickname} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-foreground">
          {user.nickname}
        </p>
        <p className="truncate text-xs font-medium text-krew-muted">
          {user.department}
        </p>
      </div>
    </button>
  );
}
