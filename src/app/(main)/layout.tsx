import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Header } from "@/components/layout/Header";
import { SideBar } from "@/components/layout/SideBar";

// 메인 앱 셸은 각 페이지 본문만 children으로 주입받는다.
type MainLayoutProps = {
  children: React.ReactNode;
};

// SVG 아이콘 크기를 유연하게 받기 위한 공통 props.
type IconProps = {
  className?: string;
};

// 하단 탭과 사이드바에서 공용으로 쓰는 홈 아이콘.
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

// 검색 이동용 아이콘.
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

// 게시물 작성 진입용 아이콘.
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

// 카테고리 진입용 아이콘.
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

// 프로필 진입용 아이콘.
function ProfileIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 19c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 채팅 진입용 아이콘.
function ChatIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 6.75A2.75 2.75 0 0 1 7.75 4h8.5A2.75 2.75 0 0 1 19 6.75v6.5A2.75 2.75 0 0 1 16.25 16H11l-4.5 4v-4H7.75A2.75 2.75 0 0 1 5 13.25v-6.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 알림 진입용 아이콘.
function BellIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9.5 19a2.5 2.5 0 0 0 5 0M6.5 16.5h11l-1.4-2.1a5.5 5.5 0 0 1-.9-3V9a3.2 3.2 0 1 0-6.4 0v2.4a5.5 5.5 0 0 1-.9 3l-1.4 2.1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 모바일/웹 공통 메인 레이아웃. 페이지 데이터와 무관한 앱 셸만 책임진다.
export default function MainLayout({ children }: MainLayoutProps) {
  const logo = <span>UNIVER</span>;

  // 모바일 헤더 우측 액션 구성.
  const headerActions = [
    {
      href: "/notifications",
      label: "알림",
      icon: <BellIcon />,
    },
    {
      href: "/chat",
      label: "채팅",
      icon: <ChatIcon />,
    },
  ];

  // 모바일 하단 탭 구성. 중앙 작성 버튼도 같은 배열에서 관리한다.
  const navigationItems = [
    {
      href: "/",
      label: "홈",
      icon: <HomeIcon />,
      isActive: true,
    },
    {
      href: "/search",
      label: "검색",
      icon: <SearchIcon />,
    },
    {
      href: "/posts/write",
      label: "+",
      icon: <PlusIcon />,
      isPrimary: true,
    },
    {
      href: "/category",
      label: "카테고리",
      icon: <CategoryIcon />,
    },
    {
      href: "/profile/me",
      label: "프로필",
      icon: <ProfileIcon />,
    },
  ];

  // 웹 사이드바는 모바일 탭과 달리 작성 버튼을 별도 하단 액션으로 분리한다.
  const sideBarItems = [
    navigationItems[0],
    navigationItems[1],
    {
      href: "/category",
      label: "카테고리",
      icon: <CategoryIcon />,
    },
    {
      href: "/profile/me",
      label: "프로필",
      icon: <ProfileIcon />,
    },
    {
      href: "/chat",
      label: "채팅",
      icon: <ChatIcon />,
    },
    {
      href: "/notifications",
      label: "알림",
      icon: <BellIcon />,
    },
  ];

  // 웹 전용 작성 버튼 정보.
  const sideBarPostAction = {
    href: "/posts/write",
    label: "새 게시물",
    icon: <PlusIcon className="h-5 w-5" />,
  };

  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <SideBar
          logo={logo}
          items={sideBarItems}
          postAction={sideBarPostAction}
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
            <BottomTabBar items={navigationItems} />
          </div>

          {/* 우측 패널은 향후 추천/프로필/해시태그 영역이 들어올 자리다. */}
          <aside className="hidden w-80 shrink-0 lg:block">
            <div className="sticky top-0 flex min-h-screen items-start pt-8">
              <div className="h-[420px] w-full bg-white" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
