import Link from "next/link";
import { StoryItem, type Story } from "@/components/story/StoryItem";

// 스토리 목록은 상위에서 주입받고, 내부에서는 렌더링만 수행한다.
type StoryBarProps = {
  stories: Story[];
};

// 내 스토리 추가 아이콘.
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 첫 슬롯은 항상 "내 스토리" 진입점으로 고정한다.
function MyStoryItem() {
  return (
    <Link
      href="/story/create"
      className="flex w-[72px] shrink-0 cursor-pointer flex-col items-center gap-2 text-center"
    >
      <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-zinc-300 bg-white">
        <div className="flex h-[66px] w-[66px] items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700">
          나
        </div>
        <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-zinc-950 text-white">
          <PlusIcon />
        </span>
      </div>
      <span className="line-clamp-1 w-full text-xs font-medium text-zinc-700">
        내 스토리
      </span>
    </Link>
  );
}

// 가로 스크롤 가능한 스토리바. 실제 데이터 조회는 나중에 연결한다.
export function StoryBar({ stories }: StoryBarProps) {
  return (
    <section className="bg-white">
      <div className="flex gap-4 overflow-x-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <MyStoryItem />
        {stories.map((story) => (
          <StoryItem
            key={story.id}
            story={story}
            viewed={story.viewed ?? false}
          />
        ))}
      </div>
    </section>
  );
}
