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
    <header className="sticky top-0 z-20 border-b border-krew-line bg-background/95 backdrop-blur">
      <div className="grid h-14 grid-cols-3 items-center px-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center justify-self-start rounded-2xl bg-white text-foreground shadow-sm transition hover:text-krew-accent"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden="true" />
        </button>
        <h1 className="justify-self-center text-base font-black tracking-[-0.02em] text-foreground">
          내 활동
        </h1>
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
                ? "bg-krew-accent text-white shadow-[var(--krew-accent-glow)]"
                : "bg-white/75 text-krew-muted hover:bg-white hover:text-krew-accent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
