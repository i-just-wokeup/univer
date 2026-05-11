"use client";

export type ActionSheetItem = {
  danger?: boolean;
  label: string;
  onClick: () => void;
};

type ActionSheetProps = {
  isOpen: boolean;
  items: ActionSheetItem[];
  onClose: () => void;
};

export function ActionSheet({ isOpen, items, onClose }: ActionSheetProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="액션 시트 닫기"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg animate-[action-sheet-slide-up_180ms_ease-out] rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl">
        <div className="overflow-hidden rounded-t-3xl">
          {items.map((item, index) => (
            <button
              key={`${item.label}-${index}`}
              type="button"
              onClick={() => {
                item.onClick();
                onClose();
              }}
              className={`flex w-full items-center justify-center border-b border-zinc-100 px-5 py-4 text-sm font-semibold transition last:border-b-0 hover:bg-zinc-50 ${
                item.danger ? "text-red-500" : "text-zinc-950"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes action-sheet-slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
