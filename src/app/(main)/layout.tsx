import { Header } from "@/components/layout/Header";
import { NavItems } from "@/components/layout/NavItems";

// 메인 앱 셸은 각 페이지 본문만 children으로 주입받는다.
type MainLayoutProps = {
  children: React.ReactNode;
};

// 모바일/웹 공통 메인 레이아웃. 페이지 데이터와 무관한 앱 셸만 책임진다.
export default function MainLayout({ children }: MainLayoutProps) {
  const logo = <span>UNIVER</span>;

  // 모바일 헤더 우측 액션 구성.
  const headerActions = [
    {
      href: "/notifications",
      label: "알림",
      iconName: "bell" as const,
    },
    {
      href: "/chat",
      label: "메시지",
      iconName: "message" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <NavItems logo={logo} variant="sidebar" />

        <div className="flex min-h-screen flex-1 flex-col lg:flex-row lg:items-stretch">
          <div className="flex min-h-screen flex-1 flex-col">
            <Header logo={logo} actions={headerActions} />
            <main className="flex flex-1 flex-col">
              {/* 가운데 피드 컬럼 폭은 인스타그램 비슷한 밀도를 기준으로 제한한다. */}
              <div className="mx-auto flex w-full max-w-[630px] flex-1 flex-col bg-white">
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
    </div>
  );
}
