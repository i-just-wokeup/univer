"use client";

import {
  Bell,
  Home,
  MessageCircleMore,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  SquarePlay,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { Avatar } from "@/components/common/Avatar";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { SideBar } from "@/components/layout/SideBar";
import { useAppSession } from "@/features/session/AppSessionProvider";

type NavigationItem = {
  href: string;
  label: string;
  icon: ReactNode;
  isActive?: boolean;
  isPrimary?: boolean;
  onClick?: () => void;
};

type NavItemsProps =
  | {
      logo: ReactNode;
      onNotificationsClick?: () => void;
      variant: "sidebar";
    }
  | {
      logo?: never;
      variant: "bottom";
    };

export function NavItems(props: NavItemsProps) {
  const pathname = usePathname();
  const { chatUnreadCount, currentUserProfile, unreadCount } = useAppSession();
  const profileHref = currentUserProfile?.nickname
    ? `/profile/${encodeURIComponent(currentUserProfile.nickname)}`
    : "/profile/me";

  const profileAvatar = (
    <Avatar
      src={currentUserProfile?.avatar_url}
      nickname={currentUserProfile?.nickname ?? "프로필"}
      size="sm"
    />
  );
  const notificationIcon = (
    <span className="relative inline-flex">
      <Bell className="h-6 w-6" />
      {unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />
      ) : null}
    </span>
  );
  const messageIcon = (
    <span className="relative inline-flex">
      <MessageCircleMore className="h-6 w-6" />
      {chatUnreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
          {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
        </span>
      ) : null}
    </span>
  );
  const handleNotificationsClick =
    props.variant === "sidebar" ? props.onNotificationsClick : undefined;

  const navigationItems: NavigationItem[] = [
    {
      href: "/",
      label: "홈",
      icon: <Home className="h-6 w-6" strokeWidth={1.9} />,
      isActive: pathname === "/",
    },
    {
      href: "/search",
      label: "검색",
      icon: <Search className="h-6 w-6" strokeWidth={1.9} />,
      isActive: pathname.startsWith("/search"),
    },
    {
      href: "/write",
      label: "+",
      icon: <Plus className="h-6 w-6" strokeWidth={2.2} />,
      isPrimary: true,
    },
    {
      href: "/explore",
      label: "탐색",
      icon: <SquarePlay className="h-6 w-6" strokeWidth={1.9} />,
      isActive: pathname.startsWith("/explore"),
    },
    {
      href: profileHref,
      label: "마이",
      icon: profileAvatar,
      isActive: currentUserProfile?.nickname
        ? pathname === `/profile/${currentUserProfile.nickname}` ||
          pathname === "/profile/me"
        : false,
    },
  ];

  const sideBarItems: NavigationItem[] = [
    navigationItems[0],
    navigationItems[1],
    navigationItems[3],
    navigationItems[4],
    {
      href: "/messages",
      label: "메시지",
      icon: messageIcon,
      isActive: pathname.startsWith("/messages"),
    },
    {
      href: "/notifications",
      label: "알림",
      icon: notificationIcon,
      isActive: pathname.startsWith("/notifications"),
      onClick: handleNotificationsClick,
    },
    {
      href: "/settings",
      label: "설정",
      icon: <Settings className="h-6 w-6" strokeWidth={1.9} />,
      isActive: pathname.startsWith("/settings"),
    },
  ];

  const sideBarPostAction = {
    href: "/write",
    label: "새 게시물",
    icon: <Plus className="h-5 w-5" strokeWidth={2.2} />,
    isActive: pathname === "/write",
  };
  const sideBarAdminAction =
    currentUserProfile?.role === "admin"
      ? {
          href: "/admin",
          label: "관리자",
          icon: <ShieldCheck className="h-5 w-5" />,
          isActive: pathname.startsWith("/admin"),
        }
      : undefined;

  if (props.variant === "sidebar") {
    return (
      <SideBar
        logo={props.logo}
        items={sideBarItems}
        postAction={sideBarPostAction}
        secondaryAction={sideBarAdminAction}
      />
    );
  }

  return <BottomTabBar items={navigationItems} />;
}
