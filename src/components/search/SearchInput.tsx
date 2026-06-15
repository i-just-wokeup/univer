"use client";

import { Search, X } from "lucide-react";

type SearchInputProps = {
  onChange: (value: string) => void;
  value: string;
};

export function SearchInput({ onChange, value }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-krew-faint" />
      <input
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="닉네임, 해시태그 검색"
        className="h-14 w-full rounded-[20px] border border-white/75 bg-white/90 pl-11 pr-11 text-sm font-semibold text-foreground shadow-[0_10px_24px_rgba(66,43,102,0.08)] outline-none transition placeholder:font-medium placeholder:text-krew-faint focus:border-krew-accent-ring focus:bg-white"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-krew-faint transition hover:bg-krew-accent-soft hover:text-krew-accent"
          aria-label="검색어 지우기"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
