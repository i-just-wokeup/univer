import Link from "next/link";

// 모바일 하단 탭 한 칸의 렌더링 정보.
type BottomTabItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  isPrimary?: boolean;
};

// 현재는 라우팅 정보만 받고, 실제 상태 관리는 상위 레이아웃에서 결정한다.
type BottomTabBarProps = {
  items: BottomTabItem[];
};

// 모바일 전용 하단 탭바. 가운데 작성 버튼도 같은 구조 안에서 처리한다.
export function BottomTabBar({ items }: BottomTabBarProps) {
  return (
    <nav className="sticky bottom-0 z-20 border-t border-zinc-200 bg-white lg:hidden">
      <ul className="mx-auto grid h-16 w-full max-w-screen-sm grid-cols-5 px-2">
        {items.map((item) => (
          <li key={item.label} className="flex">
            <Link
              href={item.href}
              aria-label={item.label}
              aria-current={item.isActive ? "page" : undefined}
              className={`flex flex-1 items-center justify-center rounded-2xl transition ${
                item.isPrimary
                  ? "text-white"
                  : item.isActive
                    ? "text-zinc-950"
                    : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center ${
                  item.isPrimary ? "rounded-2xl bg-zinc-950 shadow-sm" : ""
                }`}
              >
                {item.icon}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
