"use client";

import { Bell, MessageCircleMore, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { Avatar } from "@/components/common/Avatar";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { SideBar } from "@/components/layout/SideBar";
import { useAppSession } from "@/features/session/AppSessionProvider";

type IconProps = {
  className?: string;
};

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

function HomeIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3.75 9.75L12 3l8.25 6.75V20.25H14.25v-5.5h-4.5v5.5H3.75V9.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle
        cx="11"
        cy="11"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16 16L20 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExploreIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M14.8 9.2l-1.6 4-4 1.6 1.6-4 4-1.6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
      icon: <HomeIcon />,
      isActive: pathname === "/",
    },
    {
      href: "/search",
      label: "검색",
      icon: <SearchIcon />,
      isActive: pathname.startsWith("/search"),
    },
    {
      href: "/write",
      label: "+",
      icon: <PlusIcon />,
      isPrimary: true,
    },
    {
      href: "/explore",
      label: "탐색",
      icon: <ExploreIcon />,
      isActive: pathname.startsWith("/explore"),
    },
    {
      href: profileHref,
      label: "프로필",
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
  ];

  const sideBarPostAction = {
    href: "/write",
    label: "새 게시물",
    icon: <PlusIcon className="h-5 w-5" />,
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
