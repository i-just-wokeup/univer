import Link from "next/link";

// 웹 전용 사이드바 네비게이션 항목 정의.
type SideBarItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
};

// 앱 전환을 고려해 렌더링 정보만 props로 받는다.
type SideBarProps = {
  logo: React.ReactNode;
  items: SideBarItem[];
  postAction: {
    href: string;
    label: string;
    icon: React.ReactNode;
  };
};

// 데스크톱에서만 보이는 고정 사이드바. 메뉴와 작성 버튼을 분리해 유지한다.
export function SideBar({ logo, items, postAction }: SideBarProps) {
  return (
    <aside className="hidden h-screen border-r border-zinc-200 bg-white lg:sticky lg:top-0 lg:flex lg:w-64 lg:self-start lg:flex-col lg:justify-between lg:px-6 lg:py-8 xl:w-72">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="px-4 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
          {logo}
        </div>
        {/* 항목 수가 늘어나도 작성 버튼은 하단에 남도록 nav만 스크롤되게 둔다. */}
        <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={item.isActive ? "page" : undefined}
              className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-base transition ${
                item.isActive
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <Link
        href={postAction.href}
        className="mt-6 flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-3 text-base font-semibold text-white transition hover:bg-zinc-800"
      >
        <span>{postAction.icon}</span>
        <span>{postAction.label}</span>
      </Link>
    </aside>
  );
}
