"use client";

import { X } from "lucide-react";

type RecentSearchListProps = {
  items: string[];
  onClear: () => void;
  onRemove: (nickname: string) => void;
  onSelect: (nickname: string) => void;
};

export function RecentSearchList({
  items,
  onClear,
  onRemove,
  onSelect,
}: RecentSearchListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-zinc-950">최근 검색 항목</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-zinc-400 transition hover:text-zinc-600"
        >
          모두 지우기
        </button>
      </div>

      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-zinc-50"
          >
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="min-w-0 flex-1 text-left text-sm font-semibold text-zinc-700"
            >
              <span className="truncate">{item}</span>
            </button>
            <button
              type="button"
              onClick={() => onRemove(item)}
              className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
              aria-label={`${item} 최근 검색 삭제`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
