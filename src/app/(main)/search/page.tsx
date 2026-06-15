"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  KrewPage,
  KrewPageHeader,
  KrewSectionHeader,
  KrewSurface,
} from "@/components/common/KrewLayout";
import { RecentSearchList } from "@/components/search/RecentSearchList";
import { SearchInput } from "@/components/search/SearchInput";
import { UserSearchList } from "@/components/search/UserSearchList";
import { searchUsers, type SearchUser } from "@/features/search/api";
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  removeSearchHistory,
} from "@/features/search/history";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    getSearchHistory(),
  );
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        setResults(await searchUsers(query));
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  function moveToProfile(nickname: string) {
    addSearchHistory(nickname);
    setRecentSearches(getSearchHistory());
    router.push(`/profile/${encodeURIComponent(nickname)}`);
  }

  return (
    <KrewPage>
      <KrewPageHeader
        title="검색"
        description="닉네임과 해시태그를 찾아보세요"
      />
      <SearchInput value={query} onChange={setQuery} />
      <div className="mt-5">
        {query.trim() ? (
          <KrewSurface className="p-2">
            <KrewSectionHeader
              className="px-2 pb-1 pt-2"
              title="검색 결과"
              eyebrow={query.trim()}
            />
            <UserSearchList
              users={results}
              isLoading={isLoading}
              onSelect={(user) => moveToProfile(user.nickname)}
            />
          </KrewSurface>
        ) : (
          <RecentSearchList
            items={recentSearches}
            onSelect={moveToProfile}
            onRemove={(nickname) => {
              removeSearchHistory(nickname);
              setRecentSearches(getSearchHistory());
            }}
            onClear={() => {
              clearSearchHistory();
              setRecentSearches([]);
            }}
          />
        )}
      </div>
    </KrewPage>
  );
}
