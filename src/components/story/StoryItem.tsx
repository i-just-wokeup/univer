import Image from "next/image";

// 스토리바에서 렌더링하는 단일 스토리 최소 데이터 구조.
export type Story = {
  id: string;
  name: string;
  avatarUrl?: string;
  viewed?: boolean;
};

// viewed는 부모에서 계산해 명시적으로 내려준다.
type StoryItemProps = {
  story: Story;
  viewed: boolean;
};

// 아바타 이미지가 없을 때 fallback으로 쓸 첫 글자.
function getInitial(name: string) {
  return name.trim().charAt(0) || "?";
}

// 스토리 목록의 한 칸. 조회 여부에 따라 테두리 스타일만 바뀐다.
export function StoryItem({ story, viewed }: StoryItemProps) {
  return (
    <div className="flex w-[72px] shrink-0 flex-col items-center gap-2 text-center">
      <div
        className={`flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 bg-white ${
          viewed
            ? "border-zinc-300"
            : "border-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
        }`}
      >
        {story.avatarUrl ? (
          <Image
            src={story.avatarUrl}
            alt={story.name}
            width={66}
            height={66}
            className="h-[66px] w-[66px] rounded-full object-cover"
          />
        ) : (
          <span className="flex h-[66px] w-[66px] items-center justify-center rounded-full bg-zinc-100 text-lg font-semibold text-zinc-700">
            {getInitial(story.name)}
          </span>
        )}
      </div>
      <span className="line-clamp-1 w-full text-xs font-medium text-zinc-700">
        {story.name}
      </span>
    </div>
  );
}
