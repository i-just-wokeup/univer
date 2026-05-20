"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/common/Avatar";
import { getAdminUsers, type AdminUser } from "@/features/admin/api";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function UserSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-3xl border border-zinc-200 bg-white p-5"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-zinc-100" />
            <div className="flex-1">
              <div className="h-4 w-28 rounded-full bg-zinc-100" />
              <div className="mt-2 h-4 w-40 rounded-full bg-zinc-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadUsers(nextQuery: string) {
    try {
      setError(null);
      setIsLoading(true);

      const nextUsers = await getAdminUsers(50, 0, nextQuery);
      setUsers(nextUsers);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "유저 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers(query);
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-zinc-950">유저 관리</h1>
        <p className="mt-2 text-sm text-zinc-500">
          닉네임 또는 이메일로 유저를 검색하고 활동 현황을 확인합니다.
        </p>

        <form
          className="mt-5 flex items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(search.trim());
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="닉네임 또는 이메일 검색"
              className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
            />
          </div>
          <button
            type="submit"
            className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            검색
          </button>
        </form>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <UserSkeleton />
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
          <div className="grid grid-cols-[minmax(0,2.4fr)_140px_120px_140px_120px] gap-4 border-b border-zinc-200 px-6 py-4 text-sm font-semibold text-zinc-500">
            <span>유저</span>
            <span>가입일</span>
            <span>게시물 수</span>
            <span>신고당한 횟수</span>
            <span>권한</span>
          </div>

          {users.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm font-medium text-zinc-500">
              표시할 유저가 없습니다.
            </div>
          ) : null}

          {users.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[minmax(0,2.4fr)_140px_120px_140px_120px] gap-4 border-b border-zinc-100 px-6 py-4 last:border-b-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar src={user.avatarUrl} nickname={user.nickname} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-950">
                    {user.nickname}
                  </p>
                  <p className="truncate text-sm text-zinc-500">
                    {user.email ?? "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center text-sm text-zinc-600">
                {formatDate(user.createdAt)}
              </div>

              <div className="flex items-center text-sm font-semibold text-zinc-800">
                {user.postsCount}
              </div>

              <div
                className={`flex items-center text-sm font-semibold ${
                  user.reportedCount > 0 ? "text-red-500" : "text-zinc-500"
                }`}
              >
                {user.reportedCount}
              </div>

              <div className="flex items-center">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    user.role === "admin"
                      ? "bg-red-100 text-red-600"
                      : user.role === "official"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
