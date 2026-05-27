"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ConversationItem } from "@/components/chat/ConversationItem";
import { Avatar } from "@/components/common/Avatar";
import { getOrCreateConversation } from "@/features/chat/api";
import { useConversations } from "@/features/chat/hooks";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { searchUsers, type SearchUser } from "@/features/search/api";

type ConversationTab = "active" | "pending";

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-100" />
      <div className="min-w-0 flex-1">
        <div className="h-4 w-28 animate-pulse rounded-full bg-zinc-100" />
        <div className="mt-2 h-4 w-40 animate-pulse rounded-full bg-zinc-100" />
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const router = useRouter();
  const { active, isLoading, pending } = useConversations();
  const [activeTab, setActiveTab] = useState<ConversationTab>("active");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        setSearchResults(await searchUsers(query));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  async function openConversation(userId: string) {
    const conversationId = await getOrCreateConversation(userId);
    router.push(`/messages/${conversationId}`);
  }

  const visibleConversations = activeTab === "active" ? active : pending;

  return (
    <div className="flex min-h-full flex-col bg-white pb-20">
      <header className="border-b border-zinc-200 px-4 py-4">
        <h1 className="text-xl font-bold text-zinc-950">메시지</h1>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="닉네임으로 대화 시작"
            className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
          />
        </div>
      </header>

      {query.trim() ? (
        <section className="border-b border-zinc-100 py-2">
          {isSearching ? (
            <>
              <ConversationSkeleton />
              <ConversationSkeleton />
            </>
          ) : searchResults.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm font-medium text-zinc-500">
              검색 결과가 없습니다.
            </p>
          ) : (
            searchResults.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  void openConversation(user.id);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-50"
              >
                <Avatar src={user.avatar_url} nickname={user.nickname} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-zinc-950">
                    {user.nickname}
                  </span>
                  <span className="block truncate text-sm text-zinc-500">
                    {user.department}
                  </span>
                </span>
              </button>
            ))
          )}
        </section>
      ) : null}

      <div className="grid grid-cols-2 border-b border-zinc-200 px-4">
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`h-12 border-b-2 text-sm font-bold ${
            activeTab === "active"
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-400"
          }`}
        >
          메시지
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`flex h-12 items-center justify-center gap-2 border-b-2 text-sm font-bold ${
            activeTab === "pending"
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-400"
          }`}
        >
          요청
          {pending.length > 0 ? (
            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
              {pending.length}
            </span>
          ) : null}
        </button>
      </div>

      <main className="flex-1 py-2">
        {isLoading ? (
          <>
            <ConversationSkeleton />
            <ConversationSkeleton />
            <ConversationSkeleton />
          </>
        ) : visibleConversations.length === 0 ? (
          <p className="px-4 py-16 text-center text-sm font-medium text-zinc-500">
            아직 메시지가 없습니다.
          </p>
        ) : (
          visibleConversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => router.push(`/messages/${conversation.id}`)}
              className="block w-full"
            >
              <ConversationItem conversation={conversation} currentUserId={currentUserId} />
            </button>
          ))
        )}
      </main>
    </div>
  );
}
