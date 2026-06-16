"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/common/Avatar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  getBlockedUsers,
  unblockUser,
  type BlockedUser,
} from "@/features/blocks/api";
import { formatKoreanDateTime } from "@/lib/utils/time";

function BlockedUserSkeleton() {
  return (
    <div className="mx-4 mt-4 animate-pulse rounded-[22px] border border-white/70 bg-white/82 p-2 shadow-[var(--krew-card-shadow)]">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-2xl px-3 py-3"
        >
          <div className="h-11 w-11 shrink-0 rounded-full bg-krew-accent-soft" />
          <div className="flex-1">
            <div className="h-4 w-28 rounded-full bg-krew-accent-soft" />
            <div className="mt-2 h-3 w-20 rounded-full bg-krew-accent-soft" />
          </div>
          <div className="h-8 w-16 rounded-xl bg-krew-accent-soft" />
        </div>
      ))}
    </div>
  );
}

function BlockedEmptyState({ message }: { message: string }) {
  return (
    <section className="mx-4 mt-4 flex min-h-60 items-center justify-center rounded-[22px] border border-white/70 bg-white/82 px-6 text-center shadow-[var(--krew-card-shadow)]">
      <p className="text-sm font-semibold text-krew-muted">{message}</p>
    </section>
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

  const unblockTarget =
    blockedUsers.find((user) => user.id === unblockTargetId) ?? null;

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      <header className="sticky top-0 z-20 border-b border-krew-line bg-background/95 backdrop-blur">
        <div className="grid h-14 grid-cols-3 items-center px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center justify-self-start rounded-2xl bg-white text-foreground shadow-sm transition hover:text-krew-accent"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="justify-self-center text-base font-black tracking-[-0.02em]">
            차단한 계정
          </h1>
          <div aria-hidden="true" />
        </div>
      </header>

      <main>
        {isLoading ? (
          <BlockedUserSkeleton />
        ) : error ? (
          <BlockedEmptyState message={error} />
        ) : blockedUsers.length === 0 ? (
          <BlockedEmptyState message="차단한 계정이 없습니다." />
        ) : (
          <ul className="mx-4 mt-4 rounded-[22px] border border-white/70 bg-white/82 p-2 shadow-[var(--krew-card-shadow)]">
            {blockedUsers.map((user) => (
              <li
                key={user.id}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-krew-accent-soft"
              >
                <Avatar
                  src={user.avatar_url}
                  nickname={user.nickname}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-foreground">
                    {user.nickname}
                  </p>
                  <p className="truncate text-xs font-semibold text-krew-muted">
                    {user.department}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-krew-faint">
                    {formatKoreanDateTime(user.created_at)} 차단
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUnblockTargetId(user.id)}
                  className="shrink-0 rounded-xl border border-krew-border bg-white px-3 py-1.5 text-xs font-extrabold text-krew-muted transition hover:text-krew-accent"
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
