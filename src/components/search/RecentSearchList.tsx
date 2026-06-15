"use client";

import { X } from "lucide-react";

import {
  KrewSectionHeader,
  KrewSurface,
} from "@/components/common/KrewLayout";

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
    return (
      <KrewSurface className="p-5 text-center">
        <p className="text-sm font-semibold text-krew-muted">
          최근 검색 항목이 없습니다.
        </p>
      </KrewSurface>
    );
  }

  return (
    <KrewSurface className="p-2">
      <KrewSectionHeader
        className="px-2 pb-1 pt-2"
        title="최근 검색"
        action={
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-bold text-krew-muted transition hover:text-krew-accent"
          >
            모두 지우기
          </button>
        }
      />

      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-center justify-between rounded-2xl px-3 py-2.5 transition hover:bg-krew-accent-soft"
          >
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="min-w-0 flex-1 text-left text-sm font-bold text-foreground"
            >
              <span className="truncate">{item}</span>
            </button>
            <button
              type="button"
              onClick={() => onRemove(item)}
              className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-50 text-krew-muted transition hover:bg-krew-accent-soft hover:text-krew-accent"
              aria-label={`${item} 최근 검색 삭제`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </KrewSurface>
  );
}
