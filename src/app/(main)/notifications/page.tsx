"use client";

import { NotificationList } from "@/components/notifications/NotificationPanel";

export default function NotificationsPage() {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <NotificationList />
    </div>
  );
}
