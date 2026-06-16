"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Avatar } from "@/components/common/Avatar";
import { KREW_SURFACE_CLASS } from "@/components/common/KrewLayout";
import { Toast } from "@/components/common/Toast";
import {
  acceptFriendRequest,
  getFriends,
  getPendingRequests,
  getSentRequests,
  rejectFriendRequest,
  removeFriend,
  type ConnectionUser,
} from "@/features/profile/api";

type ConnectionTab = "friends" | "received" | "sent";

const TABS: Array<{ label: string; value: ConnectionTab }> = [
  { label: "내 크루", value: "friends" },
  { label: "받은 요청", value: "received" },
  { label: "보낸 요청", value: "sent" },
];

const EMPTY_MESSAGES: Record<ConnectionTab, string> = {
  friends: "아직 연결된 크루가 없습니다.",
  received: "받은 크루 요청이 없습니다.",
  sent: "보낸 크루 요청이 없습니다.",
};

function ConnectionSkeleton() {
  return (
    <div className={`${KREW_SURFACE_CLASS} p-2`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-2xl px-3 py-3">
          <div className="h-12 w-12 animate-pulse rounded-full bg-white/80" />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-28 animate-pulse rounded-full bg-white/80" />
            <div className="mt-2 h-4 w-36 animate-pulse rounded-full bg-white/80" />
          </div>
          <div className="h-9 w-16 animate-pulse rounded-xl bg-white/80" />
        </div>
      ))}
    </div>
  );
}

function ConnectionActions({
  isBusy,
  onAccept,
  onCancel,
  onReject,
  onRemove,
  tab,
}: {
  isBusy: boolean;
  onAccept: () => void;
  onCancel: () => void;
  onReject: () => void;
  onRemove: () => void;
  tab: ConnectionTab;
}) {
  if (tab === "friends") {
    return (
      <button
        type="button"
        disabled={isBusy}
        onClick={onRemove}
        className="h-9 rounded-xl border border-krew-border bg-white px-4 text-sm font-extrabold text-krew-muted transition hover:text-krew-accent disabled:opacity-50"
      >
        삭제
      </button>
    );
  }

  if (tab === "received") {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={onAccept}
          className="h-9 rounded-xl bg-krew-accent px-4 text-sm font-extrabold text-white transition hover:brightness-95 disabled:opacity-50"
        >
          수락
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={onReject}
          className="h-9 rounded-xl border border-krew-border bg-white px-4 text-sm font-extrabold text-krew-muted transition hover:text-krew-accent disabled:opacity-50"
        >
          거절
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={isBusy}
      onClick={onCancel}
      className="h-9 rounded-xl border border-krew-border bg-white px-4 text-sm font-extrabold text-krew-muted transition hover:text-krew-accent disabled:opacity-50"
    >
      취소
    </button>
  );
}

export default function ProfileConnectionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ConnectionTab>("friends");
  const [connections, setConnections] = useState<ConnectionUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [isToastVisible, setIsToastVisible] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setIsToastVisible(true);
  }, []);

  const loadConnections = useCallback(async () => {
    try {
      setIsLoading(true);

      const nextConnections =
        activeTab === "friends"
          ? await getFriends()
          : activeTab === "received"
            ? await getPendingRequests()
            : await getSentRequests();

      setConnections(nextConnections);
    } catch (error) {
      setConnections([]);
      showToast(
        error instanceof Error ? error.message : "크루 목록을 불러오지 못했습니다.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadConnections();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadConnections]);

  async function handleConnectionAction(
    userId: string,
    action: () => Promise<void>,
    successMessage: string,
  ) {
    setBusyUserId(userId);

    try {
      await action();
      await loadConnections();
      showToast(successMessage, "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "크루 요청 처리에 실패했습니다.",
        "error",
      );
    } finally {
      setBusyUserId(null);
    }
  }

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
            크루 관리
          </h1>
          <div aria-hidden="true" />
        </div>
      </header>

      <main className="px-4 py-4">
        <div className="sticky top-14 z-10 -mx-4 bg-background/95 px-4 pb-3 pt-1 backdrop-blur">
          <div className="grid grid-cols-3 gap-1 rounded-[18px] bg-white/70 p-1 shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`h-10 rounded-[15px] text-sm font-extrabold transition ${
                  activeTab === tab.value
                    ? "bg-krew-accent text-white"
                    : "text-krew-muted hover:bg-white/70 hover:text-krew-accent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <ConnectionSkeleton />
        ) : connections.length === 0 ? (
          <section className={`${KREW_SURFACE_CLASS} flex min-h-72 items-center justify-center px-6 text-center`}>
            <p className="text-sm font-semibold text-krew-muted">
              {EMPTY_MESSAGES[activeTab]}
            </p>
          </section>
        ) : (
          <ul className={`${KREW_SURFACE_CLASS} p-2`}>
            {connections.map((user) => (
              <li
                key={user.id}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-krew-accent-soft"
              >
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/profile/${encodeURIComponent(user.nickname)}`)
                  }
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <Avatar
                    src={user.avatar_url}
                    nickname={user.nickname}
                    size="md"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-foreground">
                      {user.nickname}
                    </span>
                    <span className="mt-1 block truncate text-sm font-semibold text-krew-muted">
                      {user.department}
                    </span>
                  </span>
                </button>

                <ConnectionActions
                  isBusy={busyUserId === user.id}
                  tab={activeTab}
                  onAccept={() => {
                    void handleConnectionAction(
                      user.id,
                      () => acceptFriendRequest(user.id),
                      "크루 요청을 수락했습니다.",
                    );
                  }}
                  onCancel={() => {
                    void handleConnectionAction(
                      user.id,
                      () => rejectFriendRequest(user.id),
                      "보낸 요청을 취소했습니다.",
                    );
                  }}
                  onReject={() => {
                    void handleConnectionAction(
                      user.id,
                      () => rejectFriendRequest(user.id),
                      "크루 요청을 거절했습니다.",
                    );
                  }}
                  onRemove={() => {
                    void handleConnectionAction(
                      user.id,
                      () => removeFriend(user.id),
                      "크루를 삭제했습니다.",
                    );
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      <Toast
        isVisible={isToastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setIsToastVisible(false)}
      />
    </div>
  );
}
