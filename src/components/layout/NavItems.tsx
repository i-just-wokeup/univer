"use client";

import { Bell, MessageCircleMore } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { Avatar } from "@/components/common/Avatar";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { SideBar } from "@/components/layout/SideBar";
import { getCurrentUserProfile } from "@/features/auth/api";

type IconProps = {
  className?: string;
};

type NavigationItem = {
  href: string;
  label: string;
  icon: ReactNode;
  isActive?: boolean;
  isPrimary?: boolean;
};

type NavItemsProps =
  | {
      logo: ReactNode;
      variant: "sidebar";
    }
  | {
      logo?: never;
      variant: "bottom";
    };

type CurrentUserProfile = Pick<
  NonNullable<Awaited<ReturnType<typeof getCurrentUserProfile>>>,
  "avatar_url" | "nickname"
>;

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

function CategoryIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="13"
        y="4"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="4"
        y="13"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="13"
        y="13"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function NavItems(props: NavItemsProps) {
  const pathname = usePathname();
  const [currentUserProfile, setCurrentUserProfile] =
    useState<CurrentUserProfile | null>(null);

  useEffect(() => {
    let isMounted = true;

    getCurrentUserProfile()
      .then((profile) => {
        if (!isMounted) {
          return;
        }

        setCurrentUserProfile(
          profile
            ? {
                avatar_url: profile.avatar_url,
                nickname: profile.nickname,
              }
            : null,
        );
      })
      .catch(() => {
        if (isMounted) {
          setCurrentUserProfile(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const profileAvatar = (
    <Avatar
      src={currentUserProfile?.avatar_url}
      nickname={currentUserProfile?.nickname ?? "프로필"}
      size="sm"
    />
  );

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
      href: "/category",
      label: "카테고리",
      icon: <CategoryIcon />,
      isActive: pathname.startsWith("/category"),
    },
    {
      href: "/profile/me",
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
      href: "/chat",
      label: "메시지",
      icon: <MessageCircleMore className="h-6 w-6" />,
      isActive: pathname.startsWith("/chat"),
    },
    {
      href: "/notifications",
      label: "알림",
      icon: <Bell className="h-6 w-6" />,
      isActive: pathname.startsWith("/notifications"),
    },
  ];

  const sideBarPostAction = {
    href: "/write",
    label: "새 게시물",
    icon: <PlusIcon className="h-5 w-5" />,
  };

  if (props.variant === "sidebar") {
    return (
      <SideBar
        logo={props.logo}
        items={sideBarItems}
        postAction={sideBarPostAction}
      />
    );
  }

  return <BottomTabBar items={navigationItems} />;
}
