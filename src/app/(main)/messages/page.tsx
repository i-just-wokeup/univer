"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ConversationItem } from "@/components/chat/ConversationItem";
import { Avatar } from "@/components/common/Avatar";
import {
  KrewPage,
  KrewPageHeader,
  KrewSectionHeader,
  KrewSurface,
} from "@/components/common/KrewLayout";
import { getOrCreateConversation } from "@/features/chat/api";
import { useConversations } from "@/features/chat/hooks";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { searchUsers, type SearchUser } from "@/features/search/api";

type ConversationTab = "active" | "pending";

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-3">
      <div className="h-9 w-9 animate-pulse rounded-full bg-white/80" />
      <div className="min-w-0 flex-1">
        <div className="h-4 w-28 animate-pulse rounded-full bg-white/80" />
        <div className="mt-2 h-4 w-40 animate-pulse rounded-full bg-white/80" />
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
    <KrewPage className="pb-24">
      <KrewPageHeader title="메시지" />
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-krew-faint" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="닉네임으로 대화 시작"
          className="h-12 w-full rounded-[18px] border border-white/80 bg-white/90 pl-11 pr-4 text-sm font-semibold text-foreground shadow-sm outline-none transition placeholder:text-krew-faint focus:border-krew-accent-ring focus:bg-white"
        />
      </div>

      {query.trim() ? (
        <KrewSurface className="mt-4 p-2">
          <KrewSectionHeader
            className="px-2 pb-1 pt-2"
            title="대화 시작"
            eyebrow={query.trim()}
          />
          {isSearching ? (
            <>
              <ConversationSkeleton />
              <ConversationSkeleton />
            </>
          ) : searchResults.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm font-semibold text-krew-muted">
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
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-krew-accent-soft"
              >
                <Avatar src={user.avatar_url} nickname={user.nickname} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-foreground">
                    {user.nickname}
                  </span>
                  <span className="block truncate text-xs font-semibold text-krew-muted">
                    {user.department}
                  </span>
                </span>
              </button>
            ))
          )}
        </KrewSurface>
      ) : null}

      <div className="mt-4 grid grid-cols-2 rounded-[18px] bg-white/70 p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`h-10 rounded-[15px] text-sm font-extrabold transition ${
            activeTab === "active"
              ? "bg-krew-accent text-white"
              : "text-krew-muted hover:bg-white/70"
          }`}
        >
          메시지
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`flex h-10 items-center justify-center gap-2 rounded-[15px] text-sm font-extrabold transition ${
            activeTab === "pending"
              ? "bg-krew-accent text-white"
              : "text-krew-muted hover:bg-white/70"
          }`}
        >
          요청
          {pending.length > 0 ? (
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === "pending"
                  ? "bg-white/20 text-white"
                  : "bg-krew-accent text-white"
              }`}
            >
              {pending.length}
            </span>
          ) : null}
        </button>
      </div>

      <KrewSurface className="mt-3 p-2">
        {isLoading ? (
          <>
            <ConversationSkeleton />
            <ConversationSkeleton />
            <ConversationSkeleton />
          </>
        ) : visibleConversations.length === 0 ? (
          <p className="px-4 py-16 text-center text-sm font-semibold text-krew-muted">
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
      </KrewSurface>
    </KrewPage>
  );
}
