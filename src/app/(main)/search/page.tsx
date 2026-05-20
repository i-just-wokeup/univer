"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => setRecentSearches(getSearchHistory()), []);

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
    router.push(`/profile/${nickname}`);
  }

  return (
    <div className="min-h-full bg-white px-4 py-4">
      <SearchInput value={query} onChange={setQuery} />
      <div className="mt-5">
        {query.trim() ? (
          <UserSearchList
            users={results}
            isLoading={isLoading}
            onSelect={(user) => moveToProfile(user.nickname)}
          />
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
    </div>
  );
}
