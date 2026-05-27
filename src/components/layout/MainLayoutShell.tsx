"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import { Header } from "@/components/layout/Header";
import { NavItems } from "@/components/layout/NavItems";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";

type MainLayoutShellProps = {
  children: React.ReactNode;
};

export function MainLayoutShell({ children }: MainLayoutShellProps) {
  const pathname = usePathname();
  const [notificationPanelPathname, setNotificationPanelPathname] = useState<
    string | null
  >(null);
  const isNotificationPanelOpen = notificationPanelPathname === pathname;

  const logo = <span>UNIVER</span>;

  const headerActions = [
    {
      href: "/notifications",
      label: "알림",
      iconName: "bell" as const,
    },
    {
      href: "/messages",
      label: "메시지",
      iconName: "message" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <NavItems
          logo={logo}
          variant="sidebar"
          onNotificationsClick={() => setNotificationPanelPathname(pathname)}
        />

        <div className="flex min-h-screen flex-1 flex-col lg:flex-row lg:items-stretch">
          <div className="flex min-h-screen flex-1 flex-col">
            <Header logo={logo} actions={headerActions} />
            <main className="flex flex-1 flex-col">
              {/* 가운데 피드 컬럼 폭은 인스타그램 비슷한 밀도를 기준으로 제한한다. */}
              <div className="mx-auto flex w-full max-w-[470px] flex-1 flex-col bg-white">
                {children}
              </div>
            </main>
            <NavItems variant="bottom" />
          </div>

          {/* 우측 패널은 향후 추천/프로필/해시태그 영역이 들어올 자리다. */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-0 flex min-h-screen items-start pt-8">
              <div className="h-[420px] w-full bg-white" />
            </div>
          </aside>
        </div>
      </div>

      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => setNotificationPanelPathname(null)}
      />
    </div>
  );
}
