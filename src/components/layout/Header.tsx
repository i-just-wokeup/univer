"use client";

import { Bell, MessageCircleMore } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getUnreadCount } from "@/features/notifications/api";

// 모바일 헤더 우측 액션 링크 정의.
type HeaderAction = {
  href: string;
  label: string;
  iconName: "bell" | "message";
};

// 로고와 액션을 props로 받아 앱 셸 역할만 담당한다.
type HeaderProps = {
  logo: React.ReactNode;
  actions: HeaderAction[];
};

// 모바일 상단 고정 헤더. 웹에서는 사이드바를 쓰므로 숨긴다.
export function Header({ logo, actions }: HeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadUnreadCount() {
      try {
        const count = await getUnreadCount();

        if (isMounted) {
          setUnreadCount(count);
        }
      } catch {
        if (isMounted) {
          setUnreadCount(0);
        }
      }
    }

    void loadUnreadCount();
    window.addEventListener("notifications:refresh", loadUnreadCount);

    return () => {
      isMounted = false;
      window.removeEventListener("notifications:refresh", loadUnreadCount);
    };
  }, []);

  const icons: Record<HeaderAction["iconName"], React.ReactNode> = {
    bell: (
      <span className="relative inline-flex">
        <Bell className="h-6 w-6" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />
        ) : null}
      </span>
    ),
    message: <MessageCircleMore className="h-6 w-6" />,
  };

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white lg:hidden">
      <div className="mx-auto flex h-14 w-full max-w-screen-sm items-center justify-between px-4">
        <div className="text-lg font-semibold tracking-[-0.02em] text-zinc-950">
          {logo}
        </div>
        <div className="flex items-center gap-1">
          {actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              aria-label={action.label}
              className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              {icons[action.iconName]}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
