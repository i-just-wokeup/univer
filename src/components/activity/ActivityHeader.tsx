import { ChevronLeft } from "lucide-react";

type ActivityHeaderProps<TTab extends string> = {
  activeTab: TTab;
  onBack: () => void;
  onChangeTab: (tab: TTab) => void;
  tabs: Array<{ id: TTab; label: string }>;
};

export function ActivityHeader<TTab extends string>({
  activeTab,
  onBack,
  onChangeTab,
  tabs,
}: ActivityHeaderProps<TTab>) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
      <div className="grid h-14 grid-cols-3 items-center px-4">
        <button
          type="button"
          onClick={onBack}
          className="justify-self-start text-2xl font-light text-zinc-800"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="h-6 w-6 text-zinc-800" aria-hidden="true" />
        </button>
        <h1 className="justify-self-center text-base font-bold">내 활동</h1>
        <div aria-hidden="true" />
      </div>
      <nav className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            className={`h-9 shrink-0 rounded-full px-4 text-sm font-bold transition ${
              activeTab === tab.id
                ? "bg-zinc-950 text-white"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
