import Link from "next/link";

// 웹 전용 사이드바 네비게이션 항목 정의.
type SideBarItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
};

// 앱 전환을 고려해 렌더링 정보만 props로 받는다.
type SideBarProps = {
  logo: React.ReactNode;
  items: SideBarItem[];
  postAction: {
    href: string;
    isActive?: boolean;
    label: string;
    icon: React.ReactNode;
  };
  secondaryAction?: {
    href: string;
    isActive?: boolean;
    label: string;
    icon: React.ReactNode;
  };
};

// 데스크톱에서만 보이는 고정 사이드바. 메뉴와 작성 버튼을 분리해 유지한다.
export function SideBar({ logo, items, postAction, secondaryAction }: SideBarProps) {
  return (
    <aside className="hidden h-screen bg-white/70 lg:sticky lg:top-0 lg:flex lg:w-64 lg:self-start lg:flex-col lg:justify-between lg:px-6 lg:py-8 xl:w-72">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="px-4 text-2xl font-black tracking-[-0.04em] text-krew-accent">
          {logo}
        </div>
        {/* 항목 수가 늘어나도 작성 버튼은 하단에 남도록 nav만 스크롤되게 둔다. */}
        <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {items.map((item) => {
            const className = `flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-base transition ${
              item.isActive
                ? "bg-krew-accent text-white shadow-[0_8px_18px_rgba(124,58,237,0.22)]"
                : "text-zinc-700 hover:bg-white hover:text-krew-accent"
            }`;

            if (item.onClick) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  aria-current={item.isActive ? "page" : undefined}
                  className={className}
                >
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={item.isActive ? "page" : undefined}
                className={className}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-6 flex shrink-0 flex-col gap-3">
        {secondaryAction ? (
          <Link
            href={secondaryAction.href}
            className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-base font-semibold transition ${
              secondaryAction.isActive
                ? "border-krew-accent bg-krew-accent text-white"
                : "border-krew-border bg-white text-zinc-700 hover:text-krew-accent"
            }`}
          >
            <span>{secondaryAction.icon}</span>
            <span>{secondaryAction.label}</span>
          </Link>
        ) : null}

        <Link
          href={postAction.href}
          className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-semibold transition ${
            postAction.isActive
              ? "bg-krew-accent text-white"
              : "bg-krew-accent text-white hover:brightness-95"
          }`}
        >
          <span>{postAction.icon}</span>
          <span>{postAction.label}</span>
        </Link>
      </div>
    </aside>
  );
}
