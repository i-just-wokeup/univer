"use client";

import type { SearchUser } from "@/features/search/api";

import { UserSearchResult } from "./UserSearchResult";

type UserSearchListProps = {
  isLoading: boolean;
  onSelect: (user: SearchUser) => void;
  users: SearchUser[];
};

function SearchSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
      <div className="h-9 w-9 animate-pulse rounded-full bg-zinc-100" />
      <div className="min-w-0 flex-1">
        <div className="h-4 w-28 animate-pulse rounded-full bg-zinc-100" />
        <div className="mt-2 h-4 w-20 animate-pulse rounded-full bg-zinc-100" />
      </div>
    </div>
  );
}

export function UserSearchList({
  isLoading,
  onSelect,
  users,
}: UserSearchListProps) {
  if (isLoading) {
    return (
      <div className="space-y-1">
        <SearchSkeleton />
        <SearchSkeleton />
        <SearchSkeleton />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm font-semibold text-krew-muted">
        검색 결과가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {users.map((user) => (
        <UserSearchResult
          key={user.id}
          user={user}
          onClick={() => onSelect(user)}
        />
      ))}
    </div>
  );
}
