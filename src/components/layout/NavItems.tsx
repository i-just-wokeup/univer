"use client";

import { Bell, MessageCircleMore, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { Avatar } from "@/components/common/Avatar";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { SideBar } from "@/components/layout/SideBar";
import { getCurrentUserProfile } from "@/features/auth/api";
import { getChatUnreadCount } from "@/features/chat/api";
import { getUnreadCount } from "@/features/notifications/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

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

type CurrentUserProfile = Pick<
  NonNullable<Awaited<ReturnType<typeof getCurrentUserProfile>>>,
  "avatar_url" | "nickname" | "role"
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

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
                role: profile.role,
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

  useEffect(() => {
    let isMounted = true;

    async function loadChatUnreadCount() {
      try {
        const count = await getChatUnreadCount();

        if (isMounted) {
          setChatUnreadCount(count);
        }
      } catch {
        if (isMounted) {
          setChatUnreadCount(0);
        }
      }
    }

    void loadChatUnreadCount();
    window.addEventListener("chat:refresh", loadChatUnreadCount);
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      ?.channel(`nav:conversations:${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        () => {
          void loadChatUnreadCount();
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      window.removeEventListener("chat:refresh", loadChatUnreadCount);
      if (channel) {
        void supabase?.removeChannel(channel);
      }
    };
  }, []);

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
