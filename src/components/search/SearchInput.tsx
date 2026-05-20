"use client";

import { Search, X } from "lucide-react";

type SearchInputProps = {
  onChange: (value: string) => void;
  value: string;
};

export function SearchInput({ onChange, value }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="닉네임으로 검색"
        className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-11 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
          aria-label="검색어 지우기"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
