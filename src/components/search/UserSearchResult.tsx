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
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-zinc-50"
    >
      <Avatar src={user.avatar_url} nickname={user.nickname} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-zinc-950">{user.nickname}</p>
        <p className="truncate text-sm text-zinc-500">{user.department}</p>
      </div>
    </button>
  );
}
