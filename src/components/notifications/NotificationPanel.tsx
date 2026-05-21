"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/common/Avatar";
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
  type NotificationItem,
} from "@/features/notifications/api";
import { getRelativeTimeLabel } from "@/lib/utils/time";

type NotificationPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

type NotificationListProps = {
  onAfterRead?: () => void;
};

function getNotificationText(notification: NotificationItem) {
  const nickname = notification.actor?.nickname ?? "누군가";

  switch (notification.type) {
    case "post_like":
      return `${nickname}님이 회원님의 게시물을 좋아합니다`;
    case "story_like":
      return `${nickname}님이 회원님의 스토리를 좋아합니다`;
    case "comment_like":
      return `${nickname}님이 회원님의 댓글을 좋아합니다`;
    case "post_comment":
      return `${nickname}님이 회원님의 게시물에 댓글을 남겼습니다`;
    case "friend_request":
      return `${nickname}님이 친구 신청을 보냈습니다`;
    case "friend_accepted":
      return `${nickname}님이 친구 신청을 수락했습니다`;
    case "report_received":
      return "새로운 신고가 접수됐습니다";
    default:
      return notification.message ?? "새 알림이 있습니다";
  }
}

function NotificationSkeleton() {
  return (
    <div className="flex animate-pulse gap-3 px-4 py-3">
      <div className="h-10 w-10 rounded-full bg-zinc-100" />
      <div className="min-w-0 flex-1">
        <div className="h-3 w-4/5 rounded-full bg-zinc-100" />
        <div className="mt-2 h-3 w-20 rounded-full bg-zinc-100" />
      </div>
      <div className="h-12 w-12 rounded-lg bg-zinc-100" />
    </div>
  );
}

export function NotificationList({ onAfterRead }: NotificationListProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      try {
        setIsLoading(true);
        setError(null);

        const loadedNotifications = await getNotifications();

        if (!isMounted) {
          return;
        }

        setNotifications(loadedNotifications);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "알림을 불러오지 못했습니다.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead();
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          is_read: true,
        })),
      );
      onAfterRead?.();
      window.dispatchEvent(new Event("notifications:refresh"));
    } catch (markError) {
      setError(
        markError instanceof Error
          ? markError.message
          : "전체 알림 읽음 처리에 실패했습니다.",
      );
    }
  }

  async function handleNotificationClick(notification: NotificationItem) {
    try {
      if (!notification.is_read) {
        await markAsRead(notification.id);
        setNotifications((currentNotifications) =>
          currentNotifications.map((currentNotification) =>
            currentNotification.id === notification.id
              ? { ...currentNotification, is_read: true }
              : currentNotification,
          ),
        );
        onAfterRead?.();
        window.dispatchEvent(new Event("notifications:refresh"));
      }

      if (notification.href) {
        router.push(notification.href);
      }
    } catch (markError) {
      setError(
        markError instanceof Error
          ? markError.message
          : "알림 읽음 처리에 실패했습니다.",
      );
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-100 px-4">
        <h1 className="text-lg font-bold text-zinc-950">알림</h1>
        <button
          type="button"
          onClick={() => {
            void handleMarkAllAsRead();
          }}
          className="text-sm font-semibold text-zinc-500 transition hover:text-zinc-950"
        >
          모두 읽음
        </button>
      </header>

      {error ? (
        <p className="mx-4 mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <>
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </>
        ) : null}

        {!isLoading && notifications.length === 0 ? (
          <div className="flex min-h-80 items-center justify-center px-6 text-center">
            <p className="text-sm font-medium text-zinc-500">
              아직 알림이 없습니다
            </p>
          </div>
        ) : null}

        {!isLoading
          ? notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => {
                  void handleNotificationClick(notification);
                }}
                className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-zinc-50"
              >
                <div className="flex w-3 shrink-0 justify-center pt-4">
                  {!notification.is_read ? (
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                  ) : null}
                </div>

                <Avatar
                  src={notification.actor?.avatar_url}
                  nickname={notification.actor?.nickname ?? "알림"}
                  size="md"
                />

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm leading-5 text-zinc-950 ${
                      notification.is_read ? "font-normal" : "font-semibold"
                    }`}
                  >
                    {getNotificationText(notification)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {getRelativeTimeLabel(notification.created_at)}
                  </p>
                </div>

                {notification.thumbnail_url ? (
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={notification.thumbnail_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
              </button>
            ))
          : null}
      </div>
    </div>
  );
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 hidden lg:block">
      {/* 배경 오버레이 - 클릭 시 닫기 */}
      <button
        type="button"
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
        aria-label="알림 패널 닫기"
      />
      {/* 알림 패널 - 사이드바 위에 fixed로 오버레이 */}
      <aside className="absolute bottom-0 left-0 top-0 flex w-[420px] flex-col bg-white shadow-2xl">
        <NotificationList />
      </aside>
    </div>
  );
}
