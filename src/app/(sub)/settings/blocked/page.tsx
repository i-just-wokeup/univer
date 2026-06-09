"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/common/Avatar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { getBlockedUsers, unblockUser, type BlockedUser } from "@/features/blocks/api";
import { formatKoreanDateTime } from "@/lib/utils/time";

function BlockedUserSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-zinc-100 px-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 py-4">
          <div className="h-11 w-11 shrink-0 rounded-full bg-zinc-100" />
          <div className="flex-1">
            <div className="h-4 w-28 rounded-full bg-zinc-100" />
            <div className="mt-2 h-3 w-20 rounded-full bg-zinc-100" />
          </div>
          <div className="h-8 w-16 rounded-lg bg-zinc-100" />
        </div>
      ))}
    </div>
  );
}

export default function BlockedPage() {
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unblockTargetId, setUnblockTargetId] = useState<string | null>(null);
  const [isUnblocking, setIsUnblocking] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const users = await getBlockedUsers();

        if (isMounted) {
          setBlockedUsers(users);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "차단 목록을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleConfirmUnblock() {
    if (!unblockTargetId || isUnblocking) {
      return;
    }

    try {
      setIsUnblocking(true);
      await unblockUser(unblockTargetId);
      setBlockedUsers((current) =>
        current.filter((user) => user.id !== unblockTargetId),
      );
      setUnblockTargetId(null);
    } catch {
      setUnblockTargetId(null);
    } finally {
      setIsUnblocking(false);
    }
  }

  const unblockTarget = blockedUsers.find((user) => user.id === unblockTargetId) ?? null;

  return (
    <div className="min-h-screen bg-white pb-24 text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
        <div className="grid h-14 grid-cols-3 items-center px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="justify-self-start"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-6 w-6 text-zinc-800" aria-hidden="true" />
          </button>
          <h1 className="justify-self-center text-base font-bold">차단한 계정</h1>
          <div aria-hidden="true" />
        </div>
      </header>

      <main>
        {isLoading ? (
          <BlockedUserSkeleton />
        ) : error ? (
          <section className="flex min-h-60 items-center justify-center px-6 text-center">
            <p className="text-sm font-medium text-zinc-500">{error}</p>
          </section>
        ) : blockedUsers.length === 0 ? (
          <section className="flex min-h-60 items-center justify-center px-6 text-center">
            <p className="text-sm font-medium text-zinc-500">
              차단한 계정이 없습니다.
            </p>
          </section>
        ) : (
          <ul className="divide-y divide-zinc-100 px-4">
            {blockedUsers.map((user) => (
              <li key={user.id} className="flex items-center gap-3 py-4">
                <Avatar
                  src={user.avatar_url}
                  nickname={user.nickname}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{user.nickname}</p>
                  <p className="truncate text-xs font-medium text-zinc-500">
                    {user.department}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {formatKoreanDateTime(user.created_at)} 차단
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUnblockTargetId(user.id)}
                  className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-700"
                >
                  차단 해제
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <ConfirmDialog
        isOpen={Boolean(unblockTargetId)}
        title={`${unblockTarget?.nickname ?? ""}의 차단을 해제할까요?`}
        description="차단을 해제하면 상대방이 다시 회원님을 볼 수 있습니다."
        confirmLabel={isUnblocking ? "해제 중..." : "차단 해제"}
        onCancel={() => setUnblockTargetId(null)}
        onConfirm={handleConfirmUnblock}
      />
    </div>
  );
}
