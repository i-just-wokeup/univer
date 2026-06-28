import { useCallback, useEffect, useState } from "react";

import { getNotifications, markAllAsRead, markAsRead } from "./api";
import type { NotificationItem } from "./types";

// 알림 목록 로드 + 읽음 처리. 알림 탭 시 라우팅은 화면이 담당.
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setErrorMessage("");
      setNotifications(await getNotifications());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "알림을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function retry() {
    setIsLoading(true);
    void load();
  }

  async function markAllRead() {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, is_read: true })),
    );

    try {
      await markAllAsRead();
    } catch {
      void load();
    }
  }

  // 안 읽은 알림이면 읽음 처리(낙관적). 화면 이동은 호출부.
  function markRead(notification: NotificationItem) {
    if (notification.is_read) {
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, is_read: true } : item,
      ),
    );
    void markAsRead(notification.id).catch(() => undefined);
  }

  return {
    errorMessage,
    isLoading,
    markAllRead,
    markRead,
    notifications,
    retry,
  };
}
